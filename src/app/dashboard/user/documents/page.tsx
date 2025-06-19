'use client';
import { DocumentManager } from '@/components/dashboard/DocumentManager';
import { PageTitle } from '@/components/common/PageTitle';

export default function UserDocumentsPage() {
  return (
    <>
      <PageTitle title="My Documents" description="Upload, view, and manage your documents." />
      <DocumentManager />
    </>
  );
}
