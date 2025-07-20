
'use client';
import { UserProfileForm } from '@/components/dashboard/UserProfileForm';
import { HealthyTips } from '@/components/dashboard/HealthyTips';
import { PageTitle } from '@/components/common/PageTitle';

export default function UserProfilePage() {
  return (
    <>
      <PageTitle title="My Profile" description="View and update your personal information." />
      <div className="space-y-6">
        <UserProfileForm />
        <HealthyTips />
      </div>
    </>
  );
}
