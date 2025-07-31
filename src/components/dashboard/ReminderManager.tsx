'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { EndUserProfile, Reminder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, PlusCircle, Trash2, BellRing, Loader2, Pill, Stethoscope, Edit } from 'lucide-react';
import { translations } from '@/lib/translations';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM).'),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

const editReminderSchema = z.object({
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM).'),
});
type EditReminderFormValues = z.infer<typeof editReminderSchema>;


export function ReminderManager() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: '',
      time: '09:00',
    },
  });
  
  const editForm = useForm<EditReminderFormValues>({
    resolver: zodResolver(editReminderSchema),
  });

  useEffect(() => {
    if (editingReminder) {
      const reminderDate = parseISO(editingReminder.dateTime);
      editForm.reset({
        date: reminderDate,
        time: format(reminderDate, 'HH:mm'),
      });
    }
  }, [editingReminder, editForm]);

  if (user?.role !== 'enduser') return null;

  const userProfile = user.profile as EndUserProfile;
  const reminders = userProfile.reminders || [];
  const preferredLanguage = userProfile?.preferredLanguage as keyof typeof translations || 'English';
  const t = translations[preferredLanguage]?.reminders || translations.English.reminders;

  const onSubmit = async (data: ReminderFormValues) => {
    setIsSubmitting(true);
    const { date, time, title } = data;
    const [hours, minutes] = time.split(':').map(Number);
    
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    const newReminder: Reminder = {
      id: `rem_${Date.now()}`,
      type: 'medication', 
      title,
      dateTime: combinedDateTime.toISOString(),
    };

    const updatedReminders = [...reminders, newReminder];
    
    try {
      await updateUserProfile({ ...userProfile, reminders: updatedReminders });
      toast({ title: 'Reminder Set!', description: `We'll remind you about "${title}".` });
      form.reset({ title: '', time: '09:00', date: undefined });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not set reminder.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (data: EditReminderFormValues) => {
    if (!editingReminder) return;

    const { date, time } = data;
    const [hours, minutes] = time.split(':').map(Number);
    const newDateTime = new Date(date);
    newDateTime.setHours(hours, minutes, 0, 0);

    const updatedReminders = reminders.map(r => 
      r.id === editingReminder.id ? { ...r, dateTime: newDateTime.toISOString() } : r
    );

    try {
      await updateUserProfile({ reminders: updatedReminders });
      toast({ title: 'Reminder Updated', description: 'The reminder time has been successfully changed.' });
      setEditingReminder(null);
    } catch (error) {
      toast({ title: 'Update Failed', description: 'Could not update the reminder.', variant: 'destructive' });
    }
  };

  const deleteReminder = async (reminderId: string) => {
    const updatedReminders = reminders.filter((r) => r.id !== reminderId);
    try {
      await updateUserProfile({ ...userProfile, reminders: updatedReminders });
      toast({ title: 'Reminder Removed', description: 'The reminder has been deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete reminder.', variant: 'destructive' });
    }
  };

  const renderSingleReminder = (reminder: Reminder) => {
    const notionText = reminder.notion ? <Badge variant="secondary" className="ml-2">{reminder.notion}</Badge> : '';
    let dateText = '';
    if (reminder.endDate && reminder.endDate !== reminder.dateTime) {
       dateText = `From ${format(parseISO(reminder.dateTime), 'MMM d')} to ${format(parseISO(reminder.endDate), "MMM d, yyyy")}`;
    } else {
       dateText = `On ${format(parseISO(reminder.dateTime), 'PPP')}`;
    }

    return (
       <div className="flex items-center justify-between w-full">
         <div className="flex-grow">
            <div className="text-sm text-muted-foreground">
                {dateText} at {format(parseISO(reminder.dateTime), 'p')}
                {notionText}
            </div>
         </div>
         <div className="flex items-center flex-shrink-0 ml-2">
            <Button variant="ghost" size="icon" onClick={() => setEditingReminder(reminder)} className="text-muted-foreground hover:text-primary">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
            </Button>
         </div>
      </div>
    )
  }

  const appointmentReminders = reminders.filter(r => r.type === 'appointment').sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  const medicationReminders = reminders.filter(r => r.type === 'medication');

  const groupedMedicationReminders = medicationReminders.reduce((acc, reminder) => {
      const title = reminder.title;
      if (!acc[title]) {
          acc[title] = [];
      }
      acc[title].push(reminder);
      return acc;
  }, {} as Record<string, Reminder[]>);

  for (const title in groupedMedicationReminders) {
    groupedMedicationReminders[title].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }

  const sortedMedicationGroups = Object.entries(groupedMedicationReminders).sort(([, remindersA], [, remindersB]) => {
      const firstDateA = new Date(remindersA[0].dateTime).getTime();
      const firstDateB = new Date(remindersB[0].dateTime).getTime();
      return firstDateA - firstDateB;
  });
  
  return (
    <>
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><BellRing className="mr-2 h-5 w-5" />{t.cardTitle}</CardTitle>
        <CardDescription>{t.cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-4">{t.upcomingReminders}</h3>
            <div className="space-y-4 max-h-[34rem] overflow-y-auto pr-2">
              {reminders.length > 0 ? (
                <>
                  {sortedMedicationGroups.map(([title, reminderGroup]) => (
                    <div key={title} className="p-3 border rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center font-semibold">
                          <Pill className="mr-2 h-5 w-5 text-primary" />
                          <p>{title}</p>
                      </div>
                      {reminderGroup.map(reminder => (
                          <div key={reminder.id}>
                              {renderSingleReminder(reminder)}
                          </div>
                      ))}
                    </div>
                  ))}

                  {(appointmentReminders.length > 0 && sortedMedicationGroups.length > 0) && <Separator className="my-4"/>}

                  {appointmentReminders.map(reminder => (
                     <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex-grow">
                          <p className="font-medium flex items-center"><Stethoscope className="mr-2 h-4 w-4 text-primary" />{reminder.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(parseISO(reminder.dateTime), { addSuffix: true })} with {reminder.doctorName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            On {format(parseISO(reminder.dateTime), "PPP 'at' p")}
                          </p>
                        </div>
                        <div className="flex items-center flex-shrink-0 ml-2">
                           <Button variant="ghost" size="icon" onClick={() => setEditingReminder(reminder)} className="text-muted-foreground hover:text-primary">
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)} className="text-destructive hover:text-destructive">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t.noReminders}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t.newReminder}</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.formTitle}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.formTitlePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t.formDate}</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>{t.formDatePlaceholder}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.formTime}</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  {t.addButton}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog open={!!editingReminder} onOpenChange={(isOpen) => !isOpen && setEditingReminder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogDescription>
              Change the date and time for your reminder: "{editingReminder?.title}".
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={editForm.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t.formDate}</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>{t.formDatePlaceholder}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={editForm.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.formTime}</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                    {editForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
