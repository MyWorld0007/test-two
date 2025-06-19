
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import type { EndUserProfile, SessionComment, Document as DocumentType } from '@/lib/types';
import { endUserProfiles, addCommentToUserSession } from '@/lib/mockData'; // Direct import for demo
import { useToast } from '@/hooks/use-toast';
import { Search, UserCircle, FileText, MessageSquare, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function UserSearchAndDisplay() {
  const { user: consultantUser } = useAuth(); // This is the consultant
  const { toast } = useToast();
  const [searchId, setSearchId] = useState('');
  const [foundUser, setFoundUser] = useState<EndUserProfile | null>(null);
  const [comment, setComment] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const handleSearch = () => {
    if (!searchId.trim()) {
      toast({ title: "Search Error", description: "Please enter a Unique ID.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    // In a real app, this would be an API call. For demo, search mockData.
    const user = endUserProfiles.find(p => p.uniqueId.toLowerCase() === searchId.toLowerCase().trim());
    setTimeout(() => { // Simulate API delay
      if (user) {
        setFoundUser(user);
      } else {
        setFoundUser(null);
        toast({ title: "Not Found", description: `No user found with Unique ID: ${searchId}.`, variant: "destructive" });
      }
      setIsSearching(false);
    }, 500);
  };

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

    // This function mutates the sessions array of the user profile object
    // that `foundUser` (if it's from `endUserProfiles`) refers to.
    addCommentToUserSession(foundUser.userId, newComment);
    
    // Since `foundUser` (via prevUser) is a reference to the mutated object,
    // its `sessions` array now ALREADY includes `newComment`.
    // We just need to trigger a re-render by creating a new object reference for the state.
    setFoundUser(prevUser => {
      if (!prevUser) return null;
      // prevUser itself (the object reference) has had its .sessions property mutated.
      // To ensure React picks up the change, we create a new shallow copy of the user object.
      // The sessions array within this new object will be the mutated one.
      return { ...prevUser }; 
    });

    setComment('');
    toast({ title: "Comment Added", description: "Your comment has been saved." });
    setIsCommenting(false);
  };

  if (consultantUser?.role !== 'consultant') {
    return <p>This feature is for consultants only.</p>
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

      {foundUser && (
        <Card className="shadow-xl animate-in fade-in-50 duration-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserCircle className="h-10 w-10 text-primary" />
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
                        {doc.extractedText && <p className="text-xs text-muted-foreground mt-1 truncate" title={doc.extractedText}>OCR: {doc.extractedText.substring(0,50)}...</p>}
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
                    {foundUser.sessions.slice().reverse().map((s: SessionComment) => ( // Show newest first
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
      )}
    </div>
  );
}

