'use client';
import { useAuth } from '@/hooks/useAuth';
import type { EndUserProfile, AccessRequest, AccessRequestStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Check, X, ShieldCheck, UserCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

export function AccessManager() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  if (user?.role !== 'enduser') {
    return <p>This page is for end users only.</p>;
  }

  const userProfile = user.profile as EndUserProfile;

  const handleRequestUpdate = (requestId: string, newStatus: AccessRequestStatus) => {
    const updatedRequests = userProfile.accessRequests.map(req =>
      req.requestId === requestId ? { ...req, status: newStatus } : req
    );
    updateUserProfile({ ...userProfile, accessRequests: updatedRequests });
    toast({
      title: "Request Updated",
      description: `The access request has been ${newStatus}.`,
    });
  };

  const pendingRequests = userProfile.accessRequests?.filter(req => req.status === 'pending') || [];
  const processedRequests = userProfile.accessRequests?.filter(req => req.status !== 'pending') || [];

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pending">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Pending Requests 
            {pendingRequests.length > 0 && <Badge className="ml-2">{pendingRequests.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="history">
            <UserCheck className="mr-2 h-4 w-4" />
            Access History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Pending Access Requests</CardTitle>
            <CardDescription>Consultants who have requested to view your profile and documents.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consultant</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map(req => (
                    <TableRow key={req.requestId}>
                      <TableCell className="font-medium">{req.consultantName}</TableCell>
                      <TableCell>{format(new Date(req.requestedAt), 'PPP')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleRequestUpdate(req.requestId, 'approved')}>
                          <Check className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRequestUpdate(req.requestId, 'declined')}>
                          <X className="mr-2 h-4 w-4" /> Decline
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No pending requests.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Access History</CardTitle>
            <CardDescription>A log of all access requests and their statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            {processedRequests.length > 0 ? (
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consultant</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRequests.slice().reverse().map(req => (
                    <TableRow key={req.requestId}>
                      <TableCell className="font-medium">{req.consultantName}</TableCell>
                      <TableCell>{format(new Date(req.requestedAt), 'PPP')}</TableCell>
                      <TableCell className="text-right">
                         <Badge variant={req.status === 'approved' ? 'default' : 'destructive'}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No access history found.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
