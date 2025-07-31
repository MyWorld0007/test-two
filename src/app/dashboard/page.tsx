'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Users, Briefcase, UserPlus, Activity, HelpCircle, CheckCircle2, History, FileSignature } from 'lucide-react';
import type { EndUserProfile, SessionComment, ConsultantProfile, PrescriptionRecord } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { getEndUsersCount, getConsultantsCount, getNewEndUsersCount, getNewConsultantsCount } from '@/lib/firestore';
import { translations } from '@/lib/translations';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalConsultants, setTotalConsultants] = useState(0);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [newConsultantsCount, setNewConsultantsCount] = useState(0);
  const [isKpiLoading, setIsKpiLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchKpis = async () => {
        setIsKpiLoading(true);
        try {
          const [
            usersCount,
            consultantsCount,
            newUsers,
            newConsultants
          ] = await Promise.all([
            getEndUsersCount(),
            getConsultantsCount(),
            getNewEndUsersCount(7),
            getNewConsultantsCount(7)
          ]);

          setTotalUsers(usersCount);
          setTotalConsultants(consultantsCount);
          setNewUsersCount(newUsers);
          setNewConsultantsCount(newConsultants);
        } catch (error) {
            console.error("Failed to fetch KPIs:", error);
        } finally {
            setIsKpiLoading(false);
        }
      }
      fetchKpis();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const endUserProfile = user.role === 'enduser' ? user.profile as EndUserProfile : null;
  const preferredLanguage = endUserProfile?.preferredLanguage as keyof typeof translations || 'English';
  const t = translations[preferredLanguage] || translations.English;


  const getWelcomeMessage = () => {
    switch (user.role) {
      case 'enduser':
        return `${t.dashboard.welcome}, ${(user.profile as EndUserProfile).firstName}! ${t.dashboard.welcomeMsg}`;
      case 'consultant':
        return `Welcome, ${(user.profile as any).firstName}! Access your tools and view user profiles.`;
      case 'admin':
        return `Welcome, ${(user.profile as any).name}! Oversee the platform and manage users.`;
      default:
        return 'Welcome to MyDocula!';
    }
  };

  const consultantProfile = user.role === 'consultant' ? user.profile as ConsultantProfile : null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to MyDocula</CardTitle>
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
                {isKpiLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{totalUsers}</div>}
                <p className="text-xs text-muted-foreground">Currently registered end users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Consultants</CardTitle>
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isKpiLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{totalConsultants}</div>}
                <p className="text-xs text-muted-foreground">Currently registered consultants</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users (7 Days)</CardTitle>
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isKpiLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{newUsersCount}</div>}
                <p className="text-xs text-muted-foreground">in the last 7 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Consultants (7 Days)</CardTitle>
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {isKpiLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{newConsultantsCount}</div>}
                <p className="text-xs text-muted-foreground">in the last 7 days</p>
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
                <p className="text-xs text-muted-foreground">Illustrative data</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queries Solved</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div> {/* Placeholder */}
                <p className="text-xs text-muted-foreground">Illustrative data</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
      
      {user.role === 'consultant' && consultantProfile && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              <div className="flex items-center">
                <History className="mr-2 h-5 w-5 text-primary" />
                User Attendance History
              </div>
            </CardTitle>
            <CardDescription>
              A log of the user profiles you have recently viewed.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {consultantProfile.attendedUsers && consultantProfile.attendedUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Name</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead className="text-right">Last Viewed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultantProfile.attendedUsers.slice().reverse().map((record) => (
                      <TableRow key={record.userId}>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>{record.userId}</TableCell>
                        <TableCell className="text-right">{format(new Date(record.lastViewed), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             ) : (
                <p className="text-center text-muted-foreground py-4">You have not viewed any user profiles yet.</p>
             )}
          </CardContent>
        </Card>
      )}

      {user.role === 'enduser' && endUserProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  {t.dashboard.sessionsTitle}
                </div>
              </CardTitle>
              <CardDescription>
                {t.dashboard.sessionsDescription}
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
                <p className="text-center text-muted-foreground py-4">{t.dashboard.noSessions}</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                <div className="flex items-center">
                  <FileSignature className="mr-2 h-5 w-5 text-primary" />
                  Prescription History
                </div>
              </CardTitle>
              <CardDescription>
                A log of all prescriptions from your consultants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {endUserProfile.prescriptions && endUserProfile.prescriptions.length > 0 ? (
                <ScrollArea className="h-72 w-full">
                  <div className="space-y-4 pr-4">
                    {endUserProfile.prescriptions.slice().reverse().map((prescription: PrescriptionRecord) => (
                      <div key={prescription.id} className="p-4 border rounded-lg bg-muted/10 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1.5">
                          <p className="font-semibold text-md text-foreground">{prescription.consultantName}</p>
                          <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                            {format(new Date(prescription.timestamp), "EEEE, MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <Separator className="my-2"/>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{prescription.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-muted-foreground py-4">No prescription history found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
