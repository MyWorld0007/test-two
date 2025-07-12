
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/common/AppLogo';
import { ArrowRight, UploadCloud, ShieldCheck, Share2, MessageSquare, HeartHandshake, Quote } from 'lucide-react';
import Image from 'next/image';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="relative p-8 bg-card rounded-2xl shadow-sm border border-border/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
        <div className="p-3 mb-4 rounded-lg bg-primary/10 text-primary w-fit">
            <Icon className="w-8 h-8" />
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

const TestimonialCard = ({ quote, author, role }: { quote: string, author: string, role: string }) => (
    <div className="bg-card p-6 rounded-xl border border-border/20 shadow-sm">
        <Quote className="w-8 h-8 text-primary mb-4" />
        <p className="text-muted-foreground mb-4">"{quote}"</p>
        <div className="font-semibold text-foreground">{author}</div>
        <div className="text-sm text-muted-foreground">{role}</div>
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
                <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Testimonials</Link>
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
        <section className="relative pt-32 pb-24 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-3xl -z-10"></div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 leading-tight">
                Your Health Story,
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Unified & Secure.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                MyDocula is the single, secure home for all your medical records. Upload, manage, and share with your consultants—all under your control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="shadow-lg">
                    <Link href="/register">
                        Create Your Secure Profile <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Free to use, forever.</p>
        </section>

        {/* Hero Image */}
        <section className="mb-24">
            <div className="relative w-full h-auto aspect-[16/9] max-w-5xl mx-auto rounded-xl border-8 border-border/10 shadow-2xl overflow-hidden">
                <Image
                    src="https://placehold.co/1200x675.png"
                    alt="Doctor showing patient information on a tablet"
                    fill
                    className="object-cover"
                    data-ai-hint="doctor patient tablet"
                    priority
                />
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30 -mx-4 px-4">
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">Your Health, Reimagined</h2>
                    <p className="text-lg text-muted-foreground mt-4">A powerful suite of tools designed for peace of mind.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard icon={ShieldCheck} title="Secure Document Hub" description="Upload, categorize, and access all your medical records anytime, anywhere with robust security." />
                    <FeatureCard icon={Share2} title="Controlled Sharing" description="You decide which consultants can view your profile, ensuring complete privacy and control over your data." />
                    <FeatureCard icon={MessageSquare} title="Consultant Communication" description="Receive and review session notes, prescriptions, and reminders directly from your healthcare consultants."/>
                    <FeatureCard icon={UploadCloud} title="AI-Powered Organization" description="Our smart system automatically scans and categorizes your documents, saving you time and effort." />
                    <FeatureCard icon={HeartHandshake} title="Insurance Simplified" description="Browse and connect with insurance providers directly through the platform, simplifying your options." />
                    <FeatureCard icon={AppLogo} title="Unified Health Profile" description="All your information—from lab results to consultant notes—in one comprehensive, easy-to-manage profile." />
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
                <div className="hidden md:block p-8">
                     <Image
                        src="https://placehold.co/600x800.png"
                        alt="A diagram showing the workflow of uploading a document"
                        width={600}
                        height={800}
                        className="object-cover rounded-xl shadow-2xl mx-auto border-8 border-border/10"
                        data-ai-hint="medical workflow diagram"
                     />
                </div>
            </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 bg-muted/30 -mx-4 px-4">
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">Loved by Patients & Doctors</h2>
                    <p className="text-lg text-muted-foreground mt-4">Don't just take our word for it. Here's what people are saying.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <TestimonialCard quote="MyDocula has been a game-changer. I can finally keep all my family's medical records organized and accessible for any appointment." author="Priya S." role="End User"/>
                    <TestimonialCard quote="As a specialist, getting a comprehensive patient history is crucial. MyDocula makes it secure and straightforward, saving valuable time during consultations." author="Dr. Ankit Verma" role="Consultant"/>
                    <TestimonialCard quote="Managing my chronic condition means juggling a lot of paperwork. This platform has simplified my life immensely. Highly recommended!" author="Rohan M." role="End User"/>
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Take Control?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Join thousands of others who are managing their health with clarity and confidence.
            </p>
            <Button asChild size="lg" className="shadow-lg">
                <Link href="/register">
                    Sign Up Now - It's Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
            </Button>
        </section>

      </main>
      
      <footer className="border-t">
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

    