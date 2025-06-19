
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Users, Briefcase, UserPlus, Activity, HelpCircle, CheckCircle2 } from 'lucide-react';
import type { EndUserProfile, SessionComment } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { endUserProfiles, consultantProfiles } from '@/lib/mockData';

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
        return `Welcome, ${(user.profile as EndUserProfile).firstName}! Manage your profile and documents here.`;
      case 'consultant':
        return `Welcome, ${(user.profile as any).firstName}! Access your tools and view user profiles.`;
      case 'admin':
        return `Welcome, ${(user.profile as any).name}! Oversee the platform and manage users.`;
      default:
        return 'Welcome to Profile Hub!';
    }
  };

  const endUserProfile = user.role === 'enduser' ? user.profile as EndUserProfile : null;

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
        </CardContent>
      </Card>

      {user.role === 'admin' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Platform KPI Overview</CardTitle>
            <CardDescription>Key metrics for platform performance and user engagement.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total End Users</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{endUserProfiles.length}</div>
                <p className="text-xs text-muted-foreground">Currently registered end users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Consultants</CardTitle>
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consultantProfiles.length}</div>
                <p className="text-xs text-muted-foreground">Currently registered consultants</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users (7 Days)</CardTitle>
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div> {/* Placeholder */}
                <p className="text-xs text-muted-foreground">Illustrative data</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Consultants (7 Days)</CardTitle>
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div> {/* Placeholder */}
                <p className="text-xs text-muted-foreground">Illustrative data</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Traffic</CardTitle>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">High</div> {/* Placeholder */}
                <p className="text-xs text-muted-foreground">Overall activity level</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queries Raised</CardTitle>
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">50</div> {/* Placeholder */}
                <p className="text-xs text-muted-foreground">Total support queries</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queries Solved</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div> {/* Placeholder */}
                <p className="text-xs text-muted-foreground">Resolved support queries</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {user.role === 'enduser' && endUserProfile && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              <div className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                Session History & Notes
              </div>
            </CardTitle>
            <CardDescription>
              Recent comments and notes from your consultations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {endUserProfile.sessions && endUserProfile.sessions.length > 0 ? (
              <ScrollArea className="h-72 w-full">
                <div className="space-y-4 pr-4">
                  {endUserProfile.sessions.slice().reverse().map((session: SessionComment) => (
                    <div key={session.id} className="p-4 border rounded-lg bg-muted/10 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1.5">
                        <p className="font-semibold text-md text-foreground">{session.consultantName}</p>
                        <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                          {format(new Date(session.timestamp), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{session.comment}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-4">No session history or consultant notes found.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
