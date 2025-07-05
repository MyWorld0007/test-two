'use client';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { HealthcareAnimation } from '@/components/auth/HealthcareAnimation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [animationType, setAnimationType] = useState('1'); // Use string for Select component

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
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
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-page-background p-4 overflow-hidden">
      <HealthcareAnimation animationType={parseInt(animationType, 10)} />
      
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-2">
            <Label htmlFor="animation-select" className="text-sm font-medium text-foreground/90">Animation Style</Label>
            <Select value={animationType} onValueChange={setAnimationType}>
            <SelectTrigger id="animation-select" className="w-[140px] h-9 bg-background/80 backdrop-blur-sm">
              <SelectValue placeholder="Select Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Fall</SelectItem>
              <SelectItem value="2">Rotate</SelectItem>
              <SelectItem value="3">Wave</SelectItem>
              <SelectItem value="4">Fade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <LoginForm />
    </main>
  );
}
