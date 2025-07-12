'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LogIn, UserPlus, FileText, ShieldCheck, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/common/AppLogo';
import { HealthcareAnimation } from '@/components/auth/HealthcareAnimation';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex flex-col items-center p-6 text-center bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/20">
        <div className="p-3 mb-4 rounded-full bg-primary/10 text-primary">
            <Icon className="w-8 h-8" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const animationType = Math.floor(Math.random() * 4) + 1; // Randomize animation on each load

  useEffect(() => {
    // Redirect logged-in users to their dashboard
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // If loading or a user is found, show a loader to avoid flashing the landing page
  if (isLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-page-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing MyDocula...</p>
      </div>
    );
  }

  // Render the landing page for unauthenticated users
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-page-background text-foreground">
      <HealthcareAnimation animationType={animationType} />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
            <AppLogo size="md"/>
            <div className="space-x-2">
                <Button asChild variant="ghost">
                    <Link href="/login">Login</Link>
                </Button>
                 <Button asChild>
                    <Link href="/register">Register</Link>
                </Button>
            </div>
        </header>

        <main className="flex flex-col items-center text-center max-w-4xl mx-auto pt-20">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Your Health, Centralized.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
                MyDocula provides a secure, centralized platform to manage all your medical documents, prescriptions, and communication with healthcare consultants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="shadow-lg">
                    <Link href="/login">
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In
                    </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="shadow-lg">
                    <Link href="/register">
                         <UserPlus className="mr-2 h-5 w-5" />
                        Create Account
                    </Link>
                </Button>
            </div>
        </main>
        
        <section className="w-full max-w-5xl mx-auto mt-20 md:mt-32">
            <h2 className="text-3xl font-bold text-center mb-10">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard icon={FileText} title="Document Hub" description="Securely upload, categorize, and access all your medical records anytime, anywhere." />
                <FeatureCard icon={ShieldCheck} title="Access Control" description="You decide which consultants can view your profile, ensuring complete privacy." />
                <FeatureCard icon={MessageSquare} title="Consultant Notes" description="Receive and review session notes and prescriptions directly from your consultants."/>
            </div>
        </section>

        <footer className="w-full text-center text-muted-foreground text-sm mt-20 pb-4">
          © {new Date().getFullYear()} MyDocula. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
