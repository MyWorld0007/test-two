
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import type { EndUserProfile, SessionComment, Document as DocumentType, AccessRequest, ConsultantProfile, Reminder } from '@/lib/types';
import { findUserByUniqueId, updateUserProfileDocument } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCircle, FileText, MessageSquare, Send, Loader2, KeyRound, Clock, ShieldX, UserCheck, ShieldBan, Eye, Pill, CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MAX_REJECTIONS = 3;

const prescriptionSchema = z.object({
  dateRange: z.object({
      from: z.date(),
      to: z.date().optional(),
    })
    .optional()
    .refine((date) => !!date?.from, { message: "A date or date range is required." }),
  reminders: z.array(z.object({
    title: z.string().min(1, 'Title is required.'),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM).'),
  })).min(1, 'You must add at least one reminder.'),
}).refine((data) => data.dateRange?.from, {
  message: "A date or date range is required.",
  path: ["dateRange"], 
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

export function UserSearchAndDisplay() {
  const { user: consultantUser, updateUserProfile: updateConsultantProfile } = useAuth();
  const { toast } = useToast();
  const [searchId, setSearchId] = useState('');
  const [foundUser, setFoundUser] = useState<EndUserProfile | null>(null);
  const [comment, setComment] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [documentToPreview, setDocumentToPreview] = useState<DocumentType | null>(null);

  const consultantProfile = consultantUser?.profile as ConsultantProfile;
  
  const prescriptionForm = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      dateRange: undefined,
      reminders: [{ title: '', time: '09:00' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: prescriptionForm.control,
    name: "reminders"
  });


  useEffect(() => {
    if (foundUser && consultantUser) {
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
          updateConsultantProfile({ ...consultantProfile, attendedUsers: updatedAttendedUsers });
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
  
  const handleSendReminder = async (data: PrescriptionFormValues) => {
    if (!foundUser || !data.dateRange?.from) return;
    setIsPrescribing(true);

    const { dateRange, reminders } = data;
    const startDate = dateRange.from;
    const endDate = dateRange.to || startDate;

    const allNewReminders: Reminder[] = [];
    
    let currentDate = new Date(startDate);
    currentDate.setHours(0,0,0,0);

    while (currentDate <= endDate) {
        reminders.forEach((reminderItem, index) => {
            const [hours, minutes] = reminderItem.time.split(':').map(Number);
            
            const combinedDateTime = new Date(currentDate);
            combinedDateTime.setHours(hours, minutes, 0, 0);
            
            allNewReminders.push({
                id: `rem_${combinedDateTime.getTime()}_${index}`,
                title: reminderItem.title,
                dateTime: combinedDateTime.toISOString(),
            });
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const updatedReminders = [...(foundUser.reminders || []), ...allNewReminders];

    try {
        await updateUserProfileDocument(foundUser.userId, { reminders: updatedReminders });
        setFoundUser(prevUser => prevUser ? { ...prevUser, reminders: updatedReminders } : null);
        toast({ title: 'Reminders Sent!', description: `${allNewReminders.length} reminder(s) have been sent to the user over the selected date range.` });
        prescriptionForm.reset({ 
          dateRange: undefined,
          reminders: [{ title: '', time: '09:00' }] 
        });
    } catch (error) {
        toast({ title: 'Error', description: 'Could not send reminders.', variant: 'destructive' });
    } finally {
        setIsPrescribing(false);
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
    }
    
    switch (status) {
      case 'approved':
        return renderUserProfile();
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
                          {doc.summary && <p className="text-xs text-muted-foreground mt-1 truncate" title={doc.summary}>Summary: {doc.summary.substring(0,60)}...</p>}
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
                <CardTitle className="flex items-center"><Pill className="mr-2 h-5 w-5 text-primary" />Prescribe & Set Reminders</CardTitle>
                <CardDescription>Prescribe medication and set reminders for the end user. This will appear in their Reminders list.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...prescriptionForm}>
                  <form onSubmit={prescriptionForm.handleSubmit(handleSendReminder)} className="space-y-6">
                    <FormField
                      control={prescriptionForm.control}
                      name="dateRange"
                      render={({ field }) => (
                          <FormItem className="flex flex-col">
                          <FormLabel>Date for Reminders</FormLabel>
                          <Popover>
                              <PopoverTrigger asChild>
                              <FormControl>
                                  <Button
                                  variant={"outline"}
                                  className={cn(
                                      "w-full justify-start pl-3 text-left font-normal",
                                      !field.value?.from && "text-muted-foreground"
                                  )}
                                  >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                   {field.value?.from ? (
                                    field.value.to ? (
                                      <>
                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                        {format(field.value.to, "LLL dd, y")}
                                      </>
                                    ) : (
                                      format(field.value.from, "LLL dd, y")
                                    )
                                  ) : (
                                    <span>Pick a date range</span>
                                  )}
                                  </Button>
                              </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                  mode="range"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                  initialFocus
                              />
                              </PopoverContent>
                          </Popover>
                          <FormMessage />
                          </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormLabel>Medications &amp; Timings</FormLabel>
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                          <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={prescriptionForm.control}
                              name={`reminders.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Title (Medicine, Dosage)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Paracetamol 500mg" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={prescriptionForm.control}
                              name={`reminders.${index}.time`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Time (24h format)</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                       <FormMessage>
                        {prescriptionForm.formState.errors.reminders?.root?.message}
                      </FormMessage>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ title: '', time: '09:00' })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Reminder
                        </Button>
                        <Button type="submit" disabled={isPrescribing}>
                            {isPrescribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send Reminders
                        </Button>
                    </div>
                  </form>
                </Form>
            </CardContent>
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
