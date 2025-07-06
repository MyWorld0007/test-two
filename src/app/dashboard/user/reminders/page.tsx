'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { ReminderManager } from '@/components/dashboard/ReminderManager';

export default function UserRemindersPage() {
  return (
    <>
      <PageTitle title="My Reminders" description="Set and manage your reminders for appointments, medication, or anything else." />
      <ReminderManager />
    </>
  );
}
