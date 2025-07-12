
'use client';

import { useState } from 'react';
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
import { CalendarIcon, PlusCircle, Trash2, BellRing, Loader2, Pill, User, Stethoscope } from 'lucide-react';
import { translations } from '@/lib/translations';
import { Badge } from '../ui/badge';

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM).'),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

export function ReminderManager() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: '',
      time: '09:00',
    },
  });

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
      type: 'medication', // Manual reminders are categorized as medication for simplicity
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

  const deleteReminder = async (reminderId: string) => {
    const updatedReminders = reminders.filter((r) => r.id !== reminderId);
    try {
      await updateUserProfile({ ...userProfile, reminders: updatedReminders });
      toast({ title: 'Reminder Removed', description: 'The reminder has been deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete reminder.', variant: 'destructive' });
    }
  };

  const renderReminderContent = (reminder: Reminder) => {
    if (reminder.type === 'appointment') {
      return (
        <div>
          <p className="font-medium flex items-center"><Stethoscope className="mr-2 h-4 w-4" />{reminder.title}</p>
          <p className="text-sm text-muted-foreground">
            Next follow-up with {reminder.doctorName} in {formatDistanceToNow(parseISO(reminder.dateTime))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
             On {format(parseISO(reminder.dateTime), "PPP 'at' p")}
          </p>
        </div>
      );
    }
    
    // Default to medication format
    const notionText = reminder.notion ? <Badge variant="secondary" className="ml-2">{reminder.notion}</Badge> : '';
    let dateText = '';
    if (reminder.endDate) {
       dateText = `From ${format(parseISO(reminder.dateTime), 'MMM d')} to ${format(parseISO(reminder.endDate), "MMM d, yyyy")}`;
    } else {
       dateText = `On ${format(parseISO(reminder.dateTime), 'PPP')}`;
    }

    return (
       <div>
        <div className="flex items-center">
            <p className="font-medium flex items-center"><Pill className="mr-2 h-4 w-4" />{reminder.title}</p>
            {notionText}
        </div>
        <p className="text-sm text-muted-foreground">
            {dateText} at {format(parseISO(reminder.dateTime), 'p')}
        </p>
      </div>
    )
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><BellRing className="mr-2 h-5 w-5" />{t.cardTitle}</CardTitle>
        <CardDescription>{t.cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-4">{t.upcomingReminders}</h3>
            <div className="space-y-3 max-h-[34rem] overflow-y-auto pr-2">
              {reminders.length > 0 ? (
                reminders
                  .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                  .map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      {renderReminderContent(reminder)}
                      <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)} className="text-destructive hover:text-destructive flex-shrink-0 ml-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
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
  );
}
