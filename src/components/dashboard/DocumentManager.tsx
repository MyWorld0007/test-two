
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import type { Document as DocumentType, EndUserProfile } from '@/lib/types';
import { scanDocument } from '@/ai/flows/scan-document';
import { summarizeText } from '@/ai/flows/summarize-text-flow';
import { useToast } from '@/hooks/use-toast';
import { FileText, UploadCloud, Edit2, ScanLine, Trash2, Loader2, Download, FileJson2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DocumentManager() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<DocumentType | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentType | null>(null);
  const [newFileName, setNewFileName] = useState('');

  useEffect(() => {
    if (user?.role === 'enduser') {
      setDocuments((user.profile as EndUserProfile).documents || []);
    }
  }, [user]);

  if (user?.role !== 'enduser') {
    return <p>Document management is only available for End Users.</p>;
  }
  const userProfile = user.profile as EndUserProfile;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    // Mock upload
    const newDocument: DocumentType = {
      id: `doc_${Date.now()}`,
      name: selectedFile.name,
      url: URL.createObjectURL(selectedFile), // For local preview, real app would use S3 URL
      uploadedAt: new Date().toISOString(),
    };

    const updatedDocuments = [...documents, newDocument];
    updateUserProfile({ ...userProfile, documents: updatedDocuments });
    setDocuments(updatedDocuments); // Update local state
    setSelectedFile(null); // Reset file input
    
    // Reset the actual file input element
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }

    setIsUploading(false);
    toast({ title: "Upload Successful", description: `${newDocument.name} has been uploaded.` });
  };
  
  const handleSummarizeDocument = async (doc: DocumentType) => {
    if (!doc.extractedText) {
        toast({ title: "Summarization Error", description: "Document must be scanned first to extract text.", variant: "destructive" });
        return;
    }

    setIsSummarizing(true);
    setSummaryResult(null);

    try {
        const result = await summarizeText({ textToSummarize: doc.extractedText });
        const summary = result.summary;
        setSummaryResult(summary);

        // Update document with the summary in the main state
        const updatedDocs = documents.map(d =>
            d.id === doc.id ? { ...d, summary: summary } : d
        );
        updateUserProfile({ ...userProfile, documents: updatedDocs });
        setDocuments(updatedDocs);
        
        // Also update the viewing document state directly to reflect the change
        setViewingDocument(prev => prev ? { ...prev, summary: summary } : null);

        toast({ title: "Summarization Successful", description: "Document summary has been generated." });

    } catch (e) {
        console.error("Summarization Error:", e);
        toast({ title: "Summarization Failed", description: (e as Error).message || "Could not summarize the document.", variant: "destructive" });
        setSummaryResult("Failed to generate summary.");
    } finally {
        setIsSummarizing(false);
    }
  };
  
  const handleScanAndSummarize = async (doc: DocumentType) => {
    toast({ title: 'Generating summary...', description: 'Please wait while we scan and summarize your document.' });

    let textToSummarize = doc.extractedText;

    // Step 1: Scan document if text doesn't exist
    if (!textToSummarize) {
      if (!doc.url.startsWith('blob:')) {
        toast({
          title: 'Summarization Failed',
          description: 'Scanning is required first and is only available for newly uploaded files in this demo.',
          variant: 'destructive',
        });
        return;
      }
      
      let base64data: string;
      try {
        const response = await fetch(doc.url);
        const blob = await response.blob();
        base64data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("File to Data URI Error:", error);
        toast({ title: "File Read Error", description: "Could not read document. It may be from a previous session. Please re-upload.", variant: "destructive" });
        return;
      }
      
      try {
        const scanResult = await scanDocument({ documentDataUri: base64data });
        textToSummarize = scanResult.extractedText;
        
        // Update document in local state to reflect extracted text
        const updatedDocsWithText = documents.map((d) =>
          d.id === doc.id ? { ...d, extractedText: textToSummarize } : d
        );
        setDocuments(updatedDocsWithText);

      } catch (e) {
        console.error('OCR Error during combined flow:', e);
        toast({
          title: 'Scan Failed',
          description: 'Could not extract text from the document. Please try again.',
          variant: 'destructive',
        });
        return; // Stop if scanning fails
      }
    }

    if (!textToSummarize) {
      toast({ title: "Summarization Error", description: "No text was found to summarize.", variant: "destructive" });
      return;
    }

    // Step 2: Summarize the text
    try {
      const summaryResultText = await summarizeText({ textToSummarize });
      const summary = summaryResultText.summary;

      // Update document with summary and persist to profile
      const finalUpdatedDocs = documents.map((d) =>
        d.id === doc.id ? { ...d, extractedText: textToSummarize, summary } : d
      );
      updateUserProfile({ ...userProfile, documents: finalUpdatedDocs });
      setDocuments(finalUpdatedDocs);

      toast({
        title: 'Summary Generated',
        description: 'The document has been successfully summarized.',
      });

      // Open the dialog to show the final result
      const finalDoc = finalUpdatedDocs.find(d => d.id === doc.id);
      if (finalDoc) {
        setViewingDocument(finalDoc);
        setSummaryResult(finalDoc.summary || null);
      }

    } catch (e) {
      console.error('Summarization Error during combined flow:', e);
      toast({
        title: 'Summarization Failed',
        description: (e as Error).message || 'Could not summarize the document.',
        variant: 'destructive',
      });
    }
  };

  const handleRenameDocument = () => {
    if (!editingDocument || !newFileName.trim()) return;
    const updatedDocs = documents.map(d => d.id === editingDocument.id ? {...d, name: newFileName.trim()} : d);
    updateUserProfile({ ...userProfile, documents: updatedDocs });
    setDocuments(updatedDocs);
    toast({ title: "Rename Successful", description: `Document renamed to ${newFileName.trim()}.` });
    setEditingDocument(null);
    setNewFileName('');
  };

  const handleDeleteDocument = (docId: string) => {
    const updatedDocs = documents.filter(d => d.id !== docId);
    updateUserProfile({ ...userProfile, documents: updatedDocs });
    setDocuments(updatedDocs);
    toast({ title: "Document Deleted", description: "The document has been removed." });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
          <CardDescription>Select a file and upload it to your profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <Input id="file-upload" type="file" onChange={handleFileChange} className="flex-grow" aria-label="Choose file"/>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Upload
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>View, manage, and summarize your uploaded documents.</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No documents uploaded yet.</p>
          ) : (
            <ScrollArea className="h-96">
              <ul className="space-y-3 pr-4">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                      <span className="truncate font-medium" title={doc.name}>{doc.name}</span>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button variant="outline" size="icon" title="View Document Summary" onClick={() => { setViewingDocument(doc); setSummaryResult(doc.summary || null); }}>
                        <ScanLine className="h-4 w-4" />
                      </Button>
                       <Button variant="outline" size="icon" title="Scan and Summarize" onClick={() => handleScanAndSummarize(doc)}>
                        <FileJson2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" title="Rename Document" onClick={() => { setEditingDocument(doc); setNewFileName(doc.name); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" title="Delete Document">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the document "{doc.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteDocument(doc.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                       {doc.url.startsWith('blob:') && (
                         <Button variant="outline" size="icon" title="Download Document" asChild>
                           <a href={doc.url} download={doc.name}>
                             <Download className="h-4 w-4" />
                           </a>
                         </Button>
                       )}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog for viewing summary */}
      <Dialog open={!!viewingDocument} onOpenChange={(isOpen) => { if (!isOpen) { setViewingDocument(null); setSummaryResult(null); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Summary: {viewingDocument?.name}</DialogTitle>
            <DialogDescription>
              View an AI-generated summary of your document in simple terms.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1">
              <h3 className="font-semibold mb-2 text-lg">AI Summary</h3>
              <ScrollArea className="h-96 border p-4 rounded-md bg-muted/20">
                {isSummarizing && !summaryResult ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Generating Summary...</p></div>
                ) : summaryResult ? (
                  <pre className="whitespace-pre-wrap text-sm">{summaryResult}</pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <p className="text-muted-foreground">No summary available.</p>
                    {viewingDocument?.extractedText && !viewingDocument?.summary && (
                      <Button onClick={() => viewingDocument && handleSummarizeDocument(viewingDocument)} disabled={isSummarizing} className="mt-4">
                        {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileJson2 className="mr-2 h-4 w-4" />}
                        Summarize with AI
                      </Button>
                    )}
                    {!viewingDocument?.extractedText && <p className="text-xs text-muted-foreground mt-2">Scan the document first to enable summarization.</p>}
                  </div>
                )}
              </ScrollArea>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for renaming document */}
      <Dialog open={!!editingDocument} onOpenChange={(isOpen) => !isOpen && setEditingDocument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>Enter a new name for "{editingDocument?.name}".</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-name" className="text-right">New Name</Label>
              <Input id="doc-name" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleRenameDocument}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
