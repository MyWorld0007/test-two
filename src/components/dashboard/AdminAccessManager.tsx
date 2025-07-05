
'use client';

import { useState } from 'react';
import { endUserProfiles, consultantProfiles, grantConsultantAccess, updateAccessRequest, resetRejectionCount } from '@/lib/mockData';
import type { EndUserProfile, ConsultantProfile, AccessRequest, AccessRequestStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShieldPlus, Check, X, Clock, Loader2, User, Briefcase, ShieldCheck, ShieldX, KeyRound, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '../ui/separator';

export function AdminAccessManager() {
  const { toast } = useToast();
  const [dataVersion, setDataVersion] = useState(0); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedConsultantForGrant, setSelectedConsultantForGrant] = useState('');
  
  const forceRerender = () => setDataVersion(v => v + 1);

  const handleStatusChange = (userId: string, requestId: string, newStatus: AccessRequestStatus) => {
    const success = updateAccessRequest(userId, requestId, newStatus);
    if (success) {
      toast({
        title: "Access Updated",
        description: `Request status has been set to ${newStatus}.`,
      });
      forceRerender();
    } else {
      toast({
        title: "Update Failed",
        description: "Could not update the access request.",
        variant: "destructive",
      });
    }
  };

  const handleGrantAccess = (userId: string, consultantId: string) => {
    if (!consultantId) {
      toast({ title: "Selection Incomplete", description: "Please select a consultant.", variant: "destructive"});
      return;
    }
    setIsProcessing(true);
    const success = grantConsultantAccess(userId, consultantId);
    if (success) {
      toast({ title: "Access Granted", description: "The consultant now has access to the user's profile." });
      forceRerender();
      setSelectedConsultantForGrant('');
    } else {
       toast({ title: "Grant Failed", description: "Could not grant access.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleRevokeAccess = (userId: string, request: AccessRequest) => {
    handleStatusChange(userId, request.requestId, 'declined');
  };
  
  const handleResetRejections = (userId: string, requestId: string) => {
    const success = resetRejectionCount(userId, requestId);
    if (success) {
      toast({ title: "Rejections Reset", description: "The consultant's rejection count for this user has been reset." });
      forceRerender();
    } else {
      toast({ title: "Reset Failed", description: "Could not reset the rejection count.", variant: "destructive" });
    }
  };


  const requestsByConsultant = consultantProfiles.map(consultant => {
    const requests = endUserProfiles.flatMap(user =>
      user.accessRequests
        .filter(req => req.consultantId === consultant.consultantId)
        .map(req => ({
          ...req,
          userId: user.userId,
          userName: `${user.firstName} ${user.lastName} (${user.uniqueId})`,
        }))
    ).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    return { ...consultant, requests };
  });

  return (
     <Tabs defaultValue="by-user" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="by-user"><User className="mr-2 h-4 w-4" />Manage by User</TabsTrigger>
        <TabsTrigger value="by-consultant"><Briefcase className="mr-2 h-4 w-4" />Manage by Consultant</TabsTrigger>
      </TabsList>
      
      <TabsContent value="by-user" className="mt-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>User Access Profiles</CardTitle>
            <CardDescription>Review and manage access permissions for each end user.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {endUserProfiles.map(user => {
                const pendingRequests = user.accessRequests.filter(r => r.status === 'pending');
                const approvedRequests = user.accessRequests.filter(r => r.status === 'approved');
                
                return (
                  <AccordionItem value={user.userId} key={user.userId}>
                    <AccordionTrigger>
                      <div className="flex justify-between w-full items-center pr-4">
                        <span>{user.firstName} {user.lastName} <span className="text-muted-foreground">({user.uniqueId})</span></span>
                        <div className="flex gap-2">
                          {pendingRequests.length > 0 && <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> {pendingRequests.length} Pending</Badge>}
                          {approvedRequests.length > 0 && <Badge variant="default"><ShieldCheck className="mr-1 h-3 w-3" /> {approvedRequests.length} Approved</Badge>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-muted/30 rounded-md">
                      {pendingRequests.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold mb-2">Pending Requests</h4>
                          {pendingRequests.map(req => (
                            <div key={req.requestId} className="flex justify-between items-center p-2 rounded-md hover:bg-background">
                              <span>{req.consultantName}</span>
                              <div className="space-x-2">
                                <Button size="sm" onClick={() => handleStatusChange(user.userId, req.requestId, 'approved')}><Check className="mr-2 h-4 w-4" />Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(user.userId, req.requestId, 'declined')}><X className="mr-2 h-4 w-4"/>Decline</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {approvedRequests.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold mb-2">Approved Access</h4>
                          {approvedRequests.map(req => (
                             <div key={req.requestId} className="flex justify-between items-center p-2 rounded-md hover:bg-background">
                               <span>{req.consultantName}</span>
                               <Button size="sm" variant="destructive" onClick={() => handleRevokeAccess(user.userId, req)}><ShieldX className="mr-2 h-4 w-4"/>Revoke</Button>
                             </div>
                          ))}
                        </div>
                      )}

                      {(pendingRequests.length > 0 || approvedRequests.length > 0) && <Separator className="my-4"/>}

                      <div>
                        <h4 className="font-semibold mb-2">Grant New Access</h4>
                        <div className="flex gap-2 items-center">
                          <Select onValueChange={setSelectedConsultantForGrant}>
                            <SelectTrigger className="flex-grow"><SelectValue placeholder="Select a consultant..." /></SelectTrigger>
                            <SelectContent>
                              {consultantProfiles
                               .filter(c => !approvedRequests.find(ar => ar.consultantId === c.consultantId))
                               .map(c => <SelectItem key={c.consultantId} value={c.consultantId}>{c.firstName} {c.lastName}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button onClick={() => handleGrantAccess(user.userId, selectedConsultantForGrant)} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4" />}
                            Grant
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="by-consultant" className="mt-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Consultant Access Requests</CardTitle>
            <CardDescription>Review and manage all requests initiated by consultants.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {requestsByConsultant.map(consultant => (
                <AccordionItem value={consultant.consultantId} key={consultant.consultantId}>
                   <AccordionTrigger>
                      <div className="flex justify-between w-full items-center pr-4">
                        <span>{consultant.firstName} {consultant.lastName}</span>
                        {consultant.requests.length > 0 && <Badge variant="secondary">{consultant.requests.length} Total Requests</Badge>}
                      </div>
                   </AccordionTrigger>
                   <AccordionContent className="p-1">
                     {consultant.requests.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Requested On</TableHead>
                              <TableHead>Rejections</TableHead>
                              <TableHead className="text-right">Status / Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {consultant.requests.map(req => (
                              <TableRow key={req.requestId}>
                                <TableCell>{req.userName}</TableCell>
                                <TableCell>{format(new Date(req.requestedAt), 'PPP')}</TableCell>
                                <TableCell className="text-center">{req.rejectionCount || 0}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {req.status === 'declined' && (req.rejectionCount || 0) > 0 && (
                                       <Button size="sm" variant="ghost" onClick={() => handleResetRejections(req.userId, req.requestId)} title="Reset Rejection Count">
                                          <RotateCcw className="h-4 w-4" />
                                       </Button>
                                    )}
                                    <Select 
                                      value={req.status} 
                                      onValueChange={(newStatus) => handleStatusChange(req.userId, req.requestId, newStatus as AccessRequestStatus)}
                                    >
                                      <SelectTrigger className="w-36">
                                        <SelectValue placeholder="Set Status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="approved"><Check className="inline-block mr-2 h-4 w-4 text-primary" />Approved</SelectItem>
                                        <SelectItem value="pending"><Clock className="inline-block mr-2 h-4 w-4 text-muted-foreground" />Pending</SelectItem>
                                        <SelectItem value="declined"><X className="inline-block mr-2 h-4 w-4 text-destructive" />Declined</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                     ) : (
                       <p className="text-center text-muted-foreground p-4">This consultant has not made any access requests.</p>
                     )}
                   </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
