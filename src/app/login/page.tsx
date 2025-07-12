'use client';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard/user/profile');
    }
  }, [user, isLoading, router]);

  if (isLoading || (!isLoading && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-page-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-page-background p-4">
      <LoginForm />
    </main>
  );
}
