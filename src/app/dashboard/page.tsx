'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getWelcomeMessage = () => {
    switch (user.role) {
      case 'enduser':
        return `Welcome, ${(user.profile as any).firstName}! Manage your profile and documents here.`;
      case 'consultant':
        return `Welcome, ${(user.profile as any).firstName}! Access your tools and view user profiles.`;
      case 'admin':
        return `Welcome, ${(user.profile as any).name}! Oversee the platform and manage users.`;
      default:
        return 'Welcome to Profile Hub!';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Profile Hub</CardTitle>
          <CardDescription>{getWelcomeMessage()}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Select an option from the sidebar to get started.</p>
          {/* Add more role-specific quick links or stats here if needed */}
        </CardContent>
      </Card>
    </div>
  );
}
