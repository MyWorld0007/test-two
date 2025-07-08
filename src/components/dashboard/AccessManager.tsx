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
import { translations } from '@/lib/translations';

export function AccessManager() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  if (user?.role !== 'enduser') {
    return <p>This page is for end users only.</p>;
  }

  const userProfile = user.profile as EndUserProfile;
  const preferredLanguage = userProfile?.preferredLanguage as keyof typeof translations || 'English';
  const t = translations[preferredLanguage]?.accessManager || translations.English.accessManager;


  const handleRequestUpdate = async (requestId: string, newStatus: AccessRequestStatus) => {
    const updatedRequests = userProfile.accessRequests.map(req => {
      if (req.requestId === requestId) {
        const updatedReq: AccessRequest = { ...req, status: newStatus };
        if (newStatus === 'approved') {
          updatedReq.approvedAt = new Date().toISOString();
        }
        return updatedReq;
      }
      return req;
    });

    // Update the profile with the new requests array
    await updateUserProfile({ ...userProfile, accessRequests: updatedRequests });
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
            {t.pendingTab}
            {pendingRequests.length > 0 && <Badge className="ml-2">{pendingRequests.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="history">
            <UserCheck className="mr-2 h-4 w-4" />
            {t.historyTab}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t.pendingCardTitle}</CardTitle>
            <CardDescription>{t.pendingCardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.pendingTableConsultant}</TableHead>
                    <TableHead>{t.pendingTableDate}</TableHead>
                    <TableHead className="text-right">{t.pendingTableAction}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map(req => (
                    <TableRow key={req.requestId}>
                      <TableCell className="font-medium">{req.consultantName}</TableCell>
                      <TableCell>{format(new Date(req.requestedAt), 'PPP')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleRequestUpdate(req.requestId, 'approved')}>
                          <Check className="mr-2 h-4 w-4" /> {t.approveButton}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRequestUpdate(req.requestId, 'declined')}>
                          <X className="mr-2 h-4 w-4" /> {t.declineButton}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">{t.noPending}</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t.historyCardTitle}</CardTitle>
            <CardDescription>{t.historyCardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {processedRequests.length > 0 ? (
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.historyTableConsultant}</TableHead>
                    <TableHead>{t.historyTableDate}</TableHead>
                    <TableHead className="text-right">{t.historyTableStatus}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRequests.slice().reverse().map(req => (
                    <TableRow key={req.requestId}>
                      <TableCell className="font-medium">{req.consultantName}</TableCell>
                      <TableCell>{format(new Date(req.requestedAt), 'PPP')}</TableCell>
                      <TableCell className="text-right">
                         <Badge variant={req.status === 'approved' ? 'default' : 'destructive'}>
                          {req.status === 'approved' ? t.statusApproved : t.statusDeclined}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">{t.noHistory}</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
