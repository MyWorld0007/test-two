'use client';

import { useState } from 'react';
import { endUserProfiles, consultantProfiles, grantConsultantAccess, updateAccessRequest } from '@/lib/mockData';
import type { EndUserProfile, ConsultantProfile, AccessRequest, AccessRequestStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShieldPlus, Check, X, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '../ui/scroll-area';

export function AdminAccessManager() {
  const { toast } = useToast();
  // Force a re-render when data changes by tracking a version number
  const [dataVersion, setDataVersion] = useState(0); 
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedConsultantId, setSelectedConsultantId] = useState('');

  const allRequests = endUserProfiles.flatMap(user => 
    user.accessRequests.map(req => ({
      ...req,
      userId: user.userId,
      userName: `${user.firstName} ${user.lastName} (${user.uniqueId})`,
    }))
  ).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const handleStatusChange = (userId: string, requestId: string, newStatus: AccessRequestStatus) => {
    const success = updateAccessRequest(userId, requestId, newStatus);
    if (success) {
      toast({
        title: "Access Updated",
        description: `Request status has been set to ${newStatus}.`,
      });
      setDataVersion(v => v + 1); // Trigger re-render
    } else {
      toast({
        title: "Update Failed",
        description: "Could not update the access request.",
        variant: "destructive",
      });
    }
  };

  const handleGrantAccess = () => {
    if (!selectedUserId || !selectedConsultantId) {
      toast({
        title: "Selection Incomplete",
        description: "Please select both a user and a consultant.",
        variant: "destructive"
      });
      return;
    }
    setGrantingAccess(true);
    const success = grantConsultantAccess(selectedUserId, selectedConsultantId);
    if (success) {
      toast({
        title: "Access Granted",
        description: "The consultant has been granted access to the user's profile.",
      });
      setDataVersion(v => v + 1); // Trigger re-render
      setSelectedUserId('');
      setSelectedConsultantId('');
    } else {
       toast({
        title: "Grant Failed",
        description: "Could not grant access. Please try again.",
        variant: "destructive",
      });
    }
    setGrantingAccess(false);
  };

  const statusVariant = {
    approved: 'default',
    pending: 'secondary',
    declined: 'destructive'
  } as const;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Grant Access Manually</CardTitle>
          <CardDescription>Directly grant a consultant access to an end user's profile.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger><SelectValue placeholder="Select End User" /></SelectTrigger>
            <SelectContent>
              {endUserProfiles.map(u => (
                <SelectItem key={u.userId} value={u.userId}>
                  {u.firstName} {u.lastName} ({u.uniqueId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedConsultantId} onValueChange={setSelectedConsultantId}>
            <SelectTrigger><SelectValue placeholder="Select Consultant" /></SelectTrigger>
            <SelectContent>
              {consultantProfiles.map(c => (
                <SelectItem key={c.consultantId} value={c.consultantId}>
                  {c.firstName} {c.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGrantAccess} disabled={grantingAccess}>
            {grantingAccess ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldPlus className="mr-2 h-4 w-4" />}
            Grant Access
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Access Requests</CardTitle>
          <CardDescription>A log of all access requests across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Consultant</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRequests.map((req) => (
                  <TableRow key={req.requestId}>
                    <TableCell className="font-medium">{req.userName}</TableCell>
                    <TableCell>{req.consultantName}</TableCell>
                    <TableCell>{format(new Date(req.requestedAt), 'PPP')}</TableCell>
                    <TableCell className="text-right w-48">
                      <Select 
                        value={req.status} 
                        onValueChange={(newStatus) => handleStatusChange(req.userId, req.requestId, newStatus as AccessRequestStatus)}
                      >
                        <SelectTrigger className={`w-full ${req.status === 'approved' ? 'border-primary' : req.status === 'declined' ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Set Status" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="approved"><Check className="inline-block mr-2 h-4 w-4 text-primary" />Approved</SelectItem>
                           <SelectItem value="pending"><Clock className="inline-block mr-2 h-4 w-4 text-muted-foreground" />Pending</SelectItem>
                           <SelectItem value="declined"><X className="inline-block mr-2 h-4 w-4 text-destructive" />Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
           {allRequests.length === 0 && <p className="text-center text-muted-foreground py-4">No access requests found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
