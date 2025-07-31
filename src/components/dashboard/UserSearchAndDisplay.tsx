'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import type { EndUserProfile, SessionComment, Document as DocumentType, AccessRequest, ConsultantProfile, Reminder, PrescriptionRecord } from '@/lib/types';
import { findUserByUniqueId, updateUserProfileDocument } from '@/lib/firestore';
import { extractRemindersFromPrescription } from '@/ai/flows/extract-reminders-from-prescription';
import { enhancePrescription } from '@/ai/flows/enhance-prescription-flow';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCircle, FileText, MessageSquare, Send, Loader2, KeyRound, Clock, ShieldX, UserCheck, ShieldBan, Eye, Pill, Bot, Sparkles, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Separator } from '../ui/separator';

const MAX_REJECTIONS = 3;

export function UserSearchAndDisplay() {
  const { user: consultantUser } = useAuth();
  const { toast } = useToast();
  const [searchId, setSearchId] = useState('');
  const [foundUser, setFoundUser] = useState<EndUserProfile | null>(null);
  const [comment, setComment] = useState('');
  const [prescriptionText, setPrescriptionText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [documentToPreview, setDocumentToPreview] = useState<DocumentType | null>(null);
  const [prescriptionIsEnhanced, setPrescriptionIsEnhanced] = useState(false);

  const consultantProfile = consultantUser?.profile as ConsultantProfile;
  
  useEffect(() => {
    if (foundUser && consultantUser?.id && consultantProfile) {
      const request = foundUser.accessRequests?.find(r => r.consultantId === consultantUser.id);
      if (request?.status === 'approved' && request.approvedAt) {
          const approvedTime = new Date(request.approvedAt).getTime();
          const now = new Date().getTime();
          const oneHour = 60 * 60 * 1000;
          if (now - approvedTime > oneHour) {
              return; 
          }

          const existingEntry = consultantProfile.attendedUsers?.find(u => u.userId === foundUser.userId);
          if (existingEntry) return;

          const newEntry = {
            userId: foundUser.userId,
            name: `${foundUser.firstName} ${foundUser.lastName}`,
            lastViewed: new Date().toISOString(),
          };
          const updatedAttendedUsers = [...(consultantProfile.attendedUsers || []), newEntry];
          
          updateUserProfileDocument(consultantUser.id, { attendedUsers: updatedAttendedUsers });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundUser, consultantUser]);


  const handleSearch = () => {
    if (!searchId.trim() || !consultantUser) {
      toast({ title: "Search Error", description: "Please enter a Unique ID.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setFoundUser(null);
    setPrescriptionIsEnhanced(false); // Reset on new search

    setTimeout(async () => {
      try {
        const user = await findUserByUniqueId(searchId.trim());
        if (user) {
            setFoundUser(user);
        } else {
            toast({ title: "Not Found", description: `No user found with Unique ID: ${searchId}.`, variant: "destructive" });
        }
      } catch (error) {
         toast({ title: "Search Failed", description: "An error occurred while searching.", variant: "destructive" });
      } finally {
        setIsSearching(false);
      }
    }, 500); // Simulate API delay
  };
  
  const handleRequestAccess = async () => {
    if (!foundUser || !consultantUser) return;
    setIsLoadingAccess(true);

    let updatedRequests = [...(foundUser.accessRequests || [])];
    let currentRequest = updatedRequests.find(r => r.consultantId === consultantUser.id);
    
    if (currentRequest) {
      if ((currentRequest.rejectionCount || 0) >= MAX_REJECTIONS) {
        toast({ title: "Request Limit Reached", description: "You cannot send more requests to this user.", variant: "destructive" });
        setIsLoadingAccess(false);
        return;
      }
      currentRequest.status = 'pending';
      currentRequest.requestedAt = new Date().toISOString();
      // Reset approvedAt when re-requesting
      delete currentRequest.approvedAt;
    } else {
       currentRequest = {
        requestId: `req_${Date.now()}`,
        consultantId: consultantUser.id,
        consultantName: `${(consultantUser.profile as any).firstName} ${(consultantUser.profile as any).lastName}`,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        rejectionCount: 0,
      };
      updatedRequests.push(currentRequest);
    }
    
    try {
        await updateUserProfileDocument(foundUser.userId, { accessRequests: updatedRequests });
        setFoundUser(prev => prev ? {...prev, accessRequests: updatedRequests} : null);
        toast({ title: "Request Sent", description: "Your access request has been sent to the user." });
    } catch (error) {
        toast({ title: "Request Failed", description: "Could not send access request.", variant: "destructive" });
    }

    setIsLoadingAccess(false);
  }

  const handleAddComment = async () => {
    if (!foundUser || !comment.trim() || !consultantUser) return;
    setIsCommenting(true);
    
    const newComment: SessionComment = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      consultantId: (consultantUser.profile as any).consultantId,
      consultantName: `${(consultantUser.profile as any).firstName} ${(consultantUser.profile as any).lastName}`,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedSessions = [...(foundUser.sessions || []), newComment];
    try {
        await updateUserProfileDocument(foundUser.userId, { sessions: updatedSessions });
        setFoundUser(prevUser => prevUser ? { ...prevUser, sessions: updatedSessions } : null); 
        setComment('');
        toast({ title: "Comment Added", description: "Your comment has been saved." });
    } catch(error) {
        toast({ title: "Error", description: "Failed to add comment.", variant: "destructive"});
    }
    
    setIsCommenting(false);
  };
  
  const handleEnhancePrescription = async () => {
    if (!prescriptionText.trim()) {
      toast({ title: "Empty Prescription", description: "Please write a prescription before enhancing.", variant: "destructive" });
      return;
    }
    setIsEnhancing(true);
    try {
      const result = await enhancePrescription({ prescriptionText });
      setPrescriptionText(result.enhancedText);
      setPrescriptionIsEnhanced(true); // Enable the confirm button
      toast({ title: "Prescription Enhanced", description: "The prescription has been clarified by AI." });
    } catch (error) {
      console.error("Enhancement Error:", error);
      toast({ title: "Enhancement Failed", description: "Could not enhance the prescription.", variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleConfirmAndRemind = async () => {
    if (!prescriptionText.trim()) {
      toast({ title: "Empty Prescription", description: "Please write a prescription before confirming.", variant: "destructive" });
      return;
    }
    if (!foundUser || !consultantUser) return;

    setIsConfirming(true);
    toast({ title: "Processing Prescription...", description: "Please wait while the AI extracts reminders and saves the record." });

    try {
        // 1. Extract reminders from the final text
        const reminderResult = await extractRemindersFromPrescription({ prescriptionText });

        if (!reminderResult.reminders || reminderResult.reminders.length === 0) {
          toast({ title: "No Reminders Found", description: "The AI could not find any specific reminders in the text.", variant: "destructive"});
        }
        
        const newReminders: Reminder[] = reminderResult.reminders.map(r => ({
          ...r,
          id: `rem_${new Date(r.dateTime).getTime()}_${Math.random().toString(36).substr(2, 5)}`,
        }));

        // 2. Create the prescription history record
        const newPrescriptionRecord: PrescriptionRecord = {
          id: `presc_${Date.now()}`,
          consultantId: consultantUser.id,
          consultantName: `${(consultantUser.profile as any).firstName} ${(consultantUser.profile as any).lastName}`,
          text: prescriptionText,
          timestamp: new Date().toISOString(),
        };

        // 3. Update Firestore with both new reminders and the new prescription record
        const updatedReminders = [...(foundUser.reminders || []), ...newReminders];
        const updatedPrescriptions = [...(foundUser.prescriptions || []), newPrescriptionRecord];

        await updateUserProfileDocument(foundUser.userId, { 
          reminders: updatedReminders,
          prescriptions: updatedPrescriptions,
        });
        
        // 4. Update local state
        setFoundUser(prev => prev ? { ...prev, reminders: updatedReminders, prescriptions: updatedPrescriptions } : null);

        toast({ title: "Success!", description: `Prescription saved and ${newReminders.length} reminder(s) set for the user.` });
        
        // 5. Reset the form
        setPrescriptionText('');
        setPrescriptionIsEnhanced(false);

    } catch (error) {
        console.error("Prescription Processing Error:", error);
        toast({ title: "Processing Failed", description: (error as Error).message || "Could not process the prescription.", variant: "destructive" });
    } finally {
        setIsConfirming(false);
    }
  };


  if (consultantUser?.role !== 'consultant') {
    return <p>This feature is for consultants only.</p>
  }
  
  const renderAccessContent = () => {
    if (!foundUser) return null;

    const request = foundUser.accessRequests?.find(r => r.consultantId === consultantUser.id) || null;
    const status = request?.status || 'none';
    const rejectionCount = request?.rejectionCount || 0;

    if (status === 'approved' && request?.approvedAt) {
      const approvedTime = new Date(request.approvedAt).getTime();
      const now = new Date().getTime();
      const oneHour = 60 * 60 * 1000;
      if (now - approvedTime > oneHour) {
        return (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center"><Clock className="h-6 w-6 mr-2 text-destructive"/> Access Expired</CardTitle>
              <CardDescription>Your one-hour access to this profile has expired. Please request access again.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRequestAccess} disabled={isLoadingAccess} variant="secondary">
                {isLoadingAccess ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Re-request Access
              </Button>
            </CardContent>
          </Card>
        );
      }
      return renderUserProfile();
    }
    
    switch (status) {
      case 'pending':
        return (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Request Pending</AlertTitle>
            <AlertDescription>Your request to access {foundUser.firstName} {foundUser.lastName}'s profile is awaiting their approval.</AlertDescription>
          </Alert>
        );
      case 'declined':
        if (rejectionCount >= MAX_REJECTIONS) {
          return (
            <Alert variant="destructive">
              <ShieldBan className="h-4 w-4" />
              <AlertTitle>Request Limit Reached</AlertTitle>
              <AlertDescription>You have been declined {rejectionCount} times. Please contact an administrator for assistance.</AlertDescription>
            </Alert>
          );
        }
        return (
           <Card className="text-center">
            <CardHeader>
               <CardTitle className="flex items-center justify-center"><ShieldX className="h-6 w-6 mr-2 text-destructive"/> Access Declined</CardTitle>
              <CardDescription>Your previous request was declined. You have {MAX_REJECTIONS - rejectionCount} attempts remaining.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRequestAccess} disabled={isLoadingAccess} variant="secondary">
                {isLoadingAccess ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Re-request Access
              </Button>
            </CardContent>
          </Card>
        );
      case 'none':
        return (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Request Access</CardTitle>
              <CardDescription>You need to request access to view this user's profile and documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRequestAccess} disabled={isLoadingAccess}>
                {isLoadingAccess ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Request Profile Access
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };
  
  const renderUserProfile = () => {
    if (!foundUser) return null;
    return (
      <div className="space-y-6">
       <Card className="shadow-xl animate-in fade-in-50 duration-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserCheck className="h-10 w-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">{`${foundUser.firstName} ${foundUser.lastName}`}</CardTitle>
                <CardDescription>Unique ID: {foundUser.uniqueId} &bull; Age: {foundUser.age} &bull; Gender: {foundUser.gender}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center"><FileText className="mr-2 h-5 w-5 text-accent" /> Documents</h3>
              {foundUser.documents && foundUser.documents.length > 0 ? (
                <ScrollArea className="h-48 border rounded-md p-3 bg-muted/20">
                  <ul className="space-y-2">
                    {foundUser.documents.map((doc: DocumentType) => (
                      <li key={doc.id} className="flex items-center justify-between text-sm p-2 rounded bg-background shadow-sm">
                         <div>
                          <p className="font-medium">{doc.name}</p>
                          {doc.summary && <p className="text-xs text-muted-foreground mt-1 truncate" title={doc.summary.outcome}>Summary: {doc.summary.outcome.substring(0,60)}...</p>}
                        </div>
                        <Button variant="outline" size="icon" title="View Document" onClick={() => setDocumentToPreview(doc)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No documents available.</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-accent" /> Session Comments</h3>
              {foundUser.sessions && foundUser.sessions.length > 0 ? (
                <ScrollArea className="h-64 border rounded-md p-3 bg-muted/20">
                  <ul className="space-y-3">
                    {foundUser.sessions.slice().reverse().map((s: SessionComment) => (
                      <li key={s.id} className="text-sm p-3 rounded bg-background shadow-md">
                        <p className="break-words">{s.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          By: {s.consultantName} on {format(new Date(s.timestamp), "PPP p")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <div className="w-full space-y-2">
              <label htmlFor="commentText" className="text-sm font-medium">Add a new comment:</label>
              <Textarea 
                id="commentText"
                placeholder="Type your comment for this user's session..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddComment} disabled={!comment.trim() || isCommenting} className="w-full sm:w-auto float-right">
                {isCommenting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Add Comment
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card className="shadow-xl animate-in fade-in-50 duration-500">
            <CardHeader>
                <CardTitle className="flex items-center"><Pill className="mr-2 h-5 w-5 text-primary" />Prescription</CardTitle>
                <CardDescription>Write the prescription, click "Done" to enhance it with AI, then confirm to save it and set reminders for the user.</CardDescription>
            </CardHeader>
            <CardContent>
               <Textarea 
                id="prescriptionText"
                placeholder="e.g., Take Ibuprofen 200mg twice a day for 5 days. Follow-up with Dr. Smith in 2 weeks."
                value={prescriptionText}
                onChange={(e) => {
                    setPrescriptionText(e.target.value);
                    setPrescriptionIsEnhanced(false); // Reset if user edits after enhancing
                }}
                rows={5}
                className="w-full"
              />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleEnhancePrescription} disabled={isEnhancing || !prescriptionText.trim()} className="w-full sm:w-auto" variant="outline">
                  {isEnhancing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Done
                </Button>
                <Separator orientation="vertical" className="h-6 hidden sm:block"/>
                <Button onClick={handleConfirmAndRemind} disabled={isConfirming || !prescriptionText.trim() || !prescriptionIsEnhanced} className="w-full sm:flex-grow">
                  {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                  Confirm & Set Reminders
                </Button>
            </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Search End User</CardTitle>
          <CardDescription>Enter the End User's Unique ID to find their profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input 
            type="text" 
            placeholder="Enter Unique ID (e.g., EU12345)" 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-grow"
            aria-label="User Unique ID"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>
        </CardContent>
      </Card>
      
      {isSearching ? (
         <div className="flex items-center justify-center pt-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      ) : (
        <div className="animate-in fade-in-50 duration-300">
          {renderAccessContent()}
        </div>
      )}

      <Dialog open={!!documentToPreview} onOpenChange={(isOpen) => !isOpen && setDocumentToPreview(null)}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{documentToPreview?.name}</DialogTitle>
            <DialogDescription>
              Document Preview
            </DialogDescription>
          </DialogHeader>
          <div className="h-full py-4">
             {documentToPreview?.dataUri && (
                <iframe src={documentToPreview.dataUri} className="w-full h-full border rounded-md" title={documentToPreview.name} />
             )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
