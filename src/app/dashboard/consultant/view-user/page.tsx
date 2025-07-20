
'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { UserSearchAndDisplay } from '@/components/dashboard/UserSearchAndDisplay';

export default function ViewUserPage() {
  return (
    <>
      <PageTitle title="View User Profile" description="Search for an End User by their Unique ID to view their profile and documents." />
      <UserSearchAndDisplay />
    </>
  );
}

    