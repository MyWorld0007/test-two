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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, PlusCircle, Trash2, BellRing, Loader2 } from 'lucide-react';

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

  const onSubmit = async (data: ReminderFormValues) => {
    setIsSubmitting(true);
    const { date, time, title } = data;
    const [hours, minutes] = time.split(':').map(Number);
    
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    const newReminder: Reminder = {
      id: `rem_${Date.now()}`,
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
  
  return (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="flex items-center"><BellRing className="mr-2 h-5 w-5" />Set a Reminder</CardTitle>
        <CardDescription>Add reminders for appointments, medication, or anything else.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Upcoming Reminders</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {reminders.length > 0 ? (
                reminders
                  .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                  .map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(reminder.dateTime), "PPP 'at' p")}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">You have no upcoming reminders.</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">New Reminder</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Doctor's Appointment" {...field} />
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
                        <FormLabel>Date</FormLabel>
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
                                    <span>Pick a date</span>
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
                                <FormLabel>Time (24h)</FormLabel>
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
                  Add Reminder
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
