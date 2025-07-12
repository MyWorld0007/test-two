
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/common/AppLogo';
import { ArrowRight, UploadCloud, ShieldCheck, Share2, FilePlus, Search, MessageSquare } from 'lucide-react';
import Image from 'next/image';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex flex-col items-start p-6 bg-card rounded-xl shadow-sm border border-border/20 transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="p-3 mb-4 rounded-lg bg-primary/10 text-primary">
            <Icon className="w-7 h-7" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground text-left">{description}</p>
    </div>
);

const HowItWorksStep = ({ number, title, description }: { number: string, title: string, description: string }) => (
    <div className="flex items-start gap-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex-shrink-0">
            {number}
        </div>
        <div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
);

export default function HomePage() {
  return (
    <div className="w-full bg-background text-foreground overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/30">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
            <Link href="/" aria-label="Home">
                <AppLogo size="md"/>
            </Link>
            <nav className="hidden md:flex gap-6 items-center">
                <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</Link>
                <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How it Works</Link>
            </nav>
            <div className="flex items-center gap-2">
                <Button asChild variant="ghost">
                    <Link href="/login">Login</Link>
                </Button>
                 <Button asChild>
                    <Link href="/register">Sign Up</Link>
                </Button>
            </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="pt-32 pb-24 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                Securely Manage & Share Your Medical Records
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                MyDocula provides a secure, centralized platform to manage all your medical documents, prescriptions, and communication with healthcare consultants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="shadow-lg">
                    <Link href="/register">
                        Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">No credit card required</p>
        </section>

        {/* Hero Image */}
        <section className="mb-24">
            <div className="relative w-full h-auto aspect-[16/9] max-w-5xl mx-auto rounded-xl border shadow-2xl">
                <Image
                    src="https://placehold.co/1200x675.png"
                    alt="Doctor showing patient information on a tablet"
                    fill
                    className="object-cover rounded-xl"
                    data-ai-hint="doctor patient tablet"
                    priority
                />
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30 -mx-4 px-4">
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Why MyDocula?</h2>
                    <p className="text-lg text-muted-foreground mt-4">Everything you need to manage your health records in one place.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard icon={ShieldCheck} title="Secure Document Hub" description="Upload, categorize, and access all your medical records anytime, anywhere with robust security." />
                    <FeatureCard icon={Share2} title="Controlled Sharing" description="You decide which consultants can view your profile, ensuring complete privacy and control over your data." />
                    <FeatureCard icon={MessageSquare} title="Consultant Communication" description="Receive and review session notes, prescriptions, and reminders directly from your healthcare consultants."/>
                </div>
            </div>
        </section>
        
        {/* How it Works Section */}
        <section id="how-it-works" className="py-24">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold">Simple Steps to Get Started</h2>
                <p className="text-lg text-muted-foreground mt-4">Take control of your health information in just a few clicks.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-12">
                    <HowItWorksStep number="1" title="Create Your Account" description="Sign up for a free account in minutes. Your personal health space is just a few clicks away."/>
                    <HowItWorksStep number="2" title="Upload Your Documents" description="Easily upload prescriptions, lab reports, and other medical documents. Our AI will help categorize them."/>
                    <HowItWorksStep number="3" title="Grant Access to Consultants" description="Search for your consultant and grant them secure, time-limited access to your profile when needed."/>
                </div>
                <div className="hidden md:block">
                     <Image
                        src="https://placehold.co/600x800.png"
                        alt="A diagram showing the workflow of uploading a document"
                        width={600}
                        height={800}
                        className="object-cover rounded-xl shadow-xl mx-auto"
                        data-ai-hint="medical workflow diagram"
                     />
                </div>
            </div>
        </section>
      </main>
      
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <AppLogo size="sm"/>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-primary">Features</Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">Login</Link>
            <Link href="/register" className="text-sm text-muted-foreground hover:text-primary">Sign Up</Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4 md:mt-0">&copy; {new Date().getFullYear()} MyDocula. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
