'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { AdminAccessManager } from '@/components/dashboard/AdminAccessManager';

export default function AdminAccessControlPage() {
  return (
    <>
      <PageTitle 
        title="Global Access Control" 
        description="Oversee and manage all consultant access requests across the platform." 
      />
      <AdminAccessManager />
    </>
  );
}
