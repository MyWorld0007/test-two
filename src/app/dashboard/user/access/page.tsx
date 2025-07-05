'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { AccessManager } from '@/components/dashboard/AccessManager';

export default function UserAccessControlPage() {
  return (
    <>
      <PageTitle title="Access Control" description="Manage consultant access to your profile." />
      <AccessManager />
    </>
  );
}
