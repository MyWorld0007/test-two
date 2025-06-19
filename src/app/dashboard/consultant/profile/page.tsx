'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { ConsultantProfileForm } from '@/components/dashboard/ConsultantProfileForm';

export default function ConsultantProfilePage() {
  return (
    <>
      <PageTitle title="Consultant Profile" description="Manage your professional profile." />
      <ConsultantProfileForm />
    </>
  );
}
