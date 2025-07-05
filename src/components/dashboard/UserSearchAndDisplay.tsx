
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import type { EndUserProfile, SessionComment, Document as DocumentType, AccessRequest, ConsultantProfile, AccessRequestStatus } from '@/lib/types';
import { endUserProfiles, addCommentToUserSession, addAccessRequest } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCircle, FileText, MessageSquare, Send, Loader2, KeyRound, Clock, ShieldX, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function UserSearchAndDisplay() {
  const { user: consultantUser, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [searchId, setSearchId] = useState('');
  const [foundUser, setFoundUser] = useState<EndUserProfile | null>(null);
  const [comment, setComment] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [accessStatus, setAccessStatus] = useState<AccessRequestStatus | 'none'>('none');
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);

  const consultantProfile = consultantUser?.profile as ConsultantProfile;
  
  useEffect(() => {
    if (accessStatus === 'approved' && foundUser && consultantUser) {
      const existingEntry = consultantProfile.attendedUsers?.find(u => u.userId === foundUser.userId);
      const newEntry = {
        userId: foundUser.userId,
        name: `${foundUser.firstName} ${foundUser.lastName}`,
        lastViewed: new Date().toISOString(),
      };
      let updatedAttendedUsers;
      if (existingEntry) {
        updatedAttendedUsers = consultantProfile.attendedUsers.map(u =>
          u.userId === foundUser.userId ? newEntry : u
        );
      } else {
        updatedAttendedUsers = [...(consultantProfile.attendedUsers || []), newEntry];
      }
      updateUserProfile({ ...consultantProfile, attendedUsers: updatedAttendedUsers });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessStatus, foundUser]);

  const handleSearch = () => {
    if (!searchId.trim() || !consultantUser) {
      toast({ title: "Search Error", description: "Please enter a Unique ID.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setFoundUser(null);
    setAccessStatus('none');

    setTimeout(() => { // Simulate API delay
      const user = endUserProfiles.find(p => p.uniqueId.toLowerCase() === searchId.toLowerCase().trim());
      if (user) {
        setFoundUser(user);
        const request = user.accessRequests?.find(r => r.consultantId === consultantUser.id);
        if (request) {
          setAccessStatus(request.status);
        } else {
          setAccessStatus('none');
        }
      } else {
        toast({ title: "Not Found", description: `No user found with Unique ID: ${searchId}.`, variant: "destructive" });
      }
      setIsSearching(false);
    }, 500);
  };
  
  const handleRequestAccess = () => {
    if (!foundUser || !consultantUser) return;
    setIsLoadingAccess(true);

    const newRequest: AccessRequest = {
      requestId: `req_${Date.now()}`,
      consultantId: consultantUser.id,
      consultantName: `${(consultantUser.profile as any).firstName} ${(consultantUser.profile as any).lastName}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    
    addAccessRequest(foundUser.userId, newRequest);
    setFoundUser(prev => prev ? {...prev, accessRequests: [...(prev.accessRequests || []), newRequest]} : null);
    setAccessStatus('pending');
    setIsLoadingAccess(false);
    toast({ title: "Request Sent", description: "Your access request has been sent to the user." });
  }

  const handleAddComment = () => {
    if (!foundUser || !comment.trim() || !consultantUser) return;
    setIsCommenting(true);
    
    const newComment: SessionComment = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      consultantId: (consultantUser.profile as any).consultantId,
      consultantName: `${(consultantUser.profile as any).firstName} ${(consultantUser.profile as any).lastName}`,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    };

    addCommentToUserSession(foundUser.userId, newComment);
    setFoundUser(prevUser => prevUser ? { ...prevUser } : null); 
    setComment('');
    toast({ title: "Comment Added", description: "Your comment has been saved." });
    setIsCommenting(false);
  };

  if (consultantUser?.role !== 'consultant') {
    return <p>This feature is for consultants only.</p>
  }
  
  const renderAccessContent = () => {
    if (!foundUser) return null;

    switch (accessStatus) {
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
        return (
           <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertTitle>Access Declined</AlertTitle>
            <AlertDescription>The user has declined your request to access their profile.</AlertDescription>
          </Alert>
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
              {foundUser.documents.length > 0 ? (
                <ScrollArea className="h-48 border rounded-md p-3 bg-muted/20">
                  <ul className="space-y-2">
                    {foundUser.documents.map((doc: DocumentType) => (
                      <li key={doc.id} className="text-sm p-2 rounded bg-background shadow-sm">
                        <p className="font-medium">{doc.name}</p>
                        {doc.summary && <p className="text-xs text-muted-foreground mt-1 truncate" title={doc.summary}>Summary: {doc.summary.substring(0,60)}...</p>}
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
              {foundUser.sessions.length > 0 ? (
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
    </div>
  );
}
