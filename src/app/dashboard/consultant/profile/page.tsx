'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { ConsultantProfileForm } from '@/components/dashboard/ConsultantProfileForm';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';

export default function ConsultantProfilePage() {
  return (
    <>
      <PageTitle title="Consultant Profile" description="Manage your professional profile and security settings." />
      <div className="space-y-6">
        <ConsultantProfileForm />
        <ChangePasswordForm />
      </div>
    </>
  );
}
