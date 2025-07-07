'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { ReminderManager } from '@/components/dashboard/ReminderManager';
import { useAuth } from '@/hooks/useAuth';
import type { EndUserProfile } from '@/lib/types';
import { translations } from '@/lib/translations';

export default function UserRemindersPage() {
  const { user } = useAuth();
  const preferredLanguage = (user?.profile as EndUserProfile)?.preferredLanguage as keyof typeof translations || 'English';
  const t = translations[preferredLanguage]?.reminders || translations.English.reminders;
  
  return (
    <>
      <PageTitle title={t.title} description={t.description} />
      <ReminderManager />
    </>
  );
}
