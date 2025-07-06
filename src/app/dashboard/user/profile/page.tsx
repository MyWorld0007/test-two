'use client';
import { UserProfileForm } from '@/components/dashboard/UserProfileForm';
import { PageTitle } from '@/components/common/PageTitle';
import { ReminderManager } from '@/components/dashboard/ReminderManager';

export default function UserProfilePage() {
  return (
    <>
      <PageTitle title="My Profile" description="View and update your personal information." />
      <UserProfileForm />
      <ReminderManager />
    </>
  );
}
