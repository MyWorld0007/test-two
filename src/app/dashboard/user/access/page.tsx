'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { AccessManager } from '@/components/dashboard/AccessManager';
import { useAuth } from '@/hooks/useAuth';
import type { EndUserProfile } from '@/lib/types';
import { translations } from '@/lib/translations';

export default function UserAccessControlPage() {
  const { user } = useAuth();
  const preferredLanguage = (user?.profile as EndUserProfile)?.preferredLanguage as keyof typeof translations || 'English';
  const t = translations[preferredLanguage]?.accessManager || translations.English.accessManager;
  return (
    <>
      <PageTitle title={t.title} description={t.description} />
      <AccessManager />
    </>
  );
}
