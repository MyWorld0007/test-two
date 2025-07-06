'use client';

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import type { Document as DocumentType, EndUserProfile, DocumentCategory } from '@/lib/types';
import { scanDocument } from '@/ai/flows/scan-document';
import { summarizeText } from '@/ai/flows/summarize-text-flow';
import { useToast } from '@/hooks/use-toast';
import { FileText, UploadCloud, Edit2, Trash2, Loader2, Download, FileJson2, Folder, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function DocumentManager() {
  const { user, addDocument, updateUserProfile } = useAuth(); // Use the new addDocument function
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentType | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentType | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [documentToPreview, setDocumentToPreview] = useState<DocumentType | null>(null);

  // Get documents directly from the auth context user profile to ensure it's always in sync.
  const documents: DocumentType[] = (user?.role === 'enduser' && (user.profile as EndUserProfile).documents) ? (user.profile as EndUserProfile).documents : [];

  if (user?.role !== 'enduser') {
    return <p>Document management is only available for End Users.</p>;
  }

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
    if (!user) return;

    setIsUploading(true);
    toast({ title: "Uploading & Categorizing...", description: "Please wait while we process your document." });

    try {
        const storageRef = ref(storage, `documents/${user.id}/${Date.now()}_${selectedFile.name}`);
        const uploadResult = await uploadBytes(storageRef, selectedFile);
        const fileUrl = await getDownloadURL(uploadResult.ref);

        const base64data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile!);
        });

        const scanResult = await scanDocument({ documentDataUri: base64data });

        const newDocument: DocumentType = {
          id: `doc_${Date.now()}`,
          name: selectedFile.name,
          url: fileUrl,
          uploadedAt: new Date().toISOString(),
          category: scanResult.category,
          extractedText: scanResult.extractedText,
        };

        const result = await addDocument(newDocument);

        if (result.success) {
            setSelectedFile(null); 
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
            toast({ title: "Upload Successful", description: `${newDocument.name} has been automatically categorized as '${newDocument.category}'.` });
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Upload and Scan Error:", error);
        toast({ title: "Processing Failed", description: (error as Error).message || "Could not automatically categorize the document.", variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleScanAndSummarize = async (doc: DocumentType) => {
    toast({ title: 'Generating summary...', description: 'Please wait while we scan and summarize your document.' });

    let textToSummarize = doc.extractedText;

    if (!textToSummarize) {
      // If there's no extracted text, we must fetch the document and scan it.
      let base64data: string;
      try {
        toast({ title: "Scan Required", description: "Document needs to be scanned first. This may take a moment."});
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
        toast({ title: "File Read Error", description: "Could not read document for scanning.", variant: "destructive" });
        return;
      }
      
      try {
        const scanResult = await scanDocument({ documentDataUri: base64data });
        textToSummarize = scanResult.extractedText;
        
        const updatedDocsWithText = documents.map((d) =>
          d.id === doc.id ? { ...d, extractedText: textToSummarize, category: scanResult.category } : d
        );
        await updateUserProfile({ documents: updatedDocsWithText });

      } catch (e) {
        console.error('OCR Error during combined flow:', e);
        toast({ title: 'Scan Failed', description: 'Could not extract text from the document.', variant: 'destructive' });
        return; 
      }
    }

    if (!textToSummarize) {
      toast({ title: "Summarization Error", description: "No text was found to summarize.", variant: "destructive" });
      return;
    }

    try {
      setIsSummarizing(true);
      setViewingDocument(doc);

      const summaryResultText = await summarizeText({ textToSummarize });
      const summary = summaryResultText.summary;

      const finalUpdatedDocs = documents.map((d) =>
        d.id === doc.id ? { ...d, summary } : d
      );
      await updateUserProfile({ documents: finalUpdatedDocs });
      
      toast({ title: 'Summary Generated', description: 'The document has been successfully summarized.'});

      const finalDoc = finalUpdatedDocs.find(d => d.id === doc.id);
      if (finalDoc) setViewingDocument(finalDoc);

    } catch (e) {
      console.error('Summarization Error:', e);
      toast({ title: 'Summarization Failed', description: (e as Error).message || 'Could not summarize the document.', variant: 'destructive' });
      setViewingDocument(null);
    } finally {
        setIsSummarizing(false);
    }
  };

  const handleRenameDocument = async () => {
    if (!editingDocument || !newFileName.trim()) return;
    const updatedDocs = documents.map(d => d.id === editingDocument.id ? {...d, name: newFileName.trim()} : d);
    await updateUserProfile({ documents: updatedDocs });
    toast({ title: "Rename Successful", description: `Document renamed to ${newFileName.trim()}.` });
    setEditingDocument(null);
    setNewFileName('');
  };

  const handleDeleteDocument = async (docId: string) => {
    const updatedDocs = documents.filter(d => d.id !== docId);
    await updateUserProfile({ documents: updatedDocs });
    toast({ title: "Document Deleted", description: "The document has been removed." });
  };
  
  const documentCategories: DocumentCategory[] = ['Lab', 'Clinical', 'Hospital', 'Estimate', 'Other'];
  const groupedDocuments = documents.reduce((acc, doc) => {
    const category = doc.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<DocumentCategory, DocumentType[]>);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
          <CardDescription>Select a file to upload. It will be categorized automatically by AI.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <Input id="file-upload" type="file" onChange={handleFileChange} className="flex-grow" aria-label="Choose file"/>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Upload and Categorize
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>View and manage your uploaded documents by category.</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No documents uploaded yet.</p>
          ) : (
            <Accordion type="multiple" className="w-full" defaultValue={documentCategories.filter(cat => groupedDocuments[cat]?.length > 0)}>
              {documentCategories.map(category => (
                groupedDocuments[category] && groupedDocuments[category].length > 0 && (
                  <AccordionItem value={category} key={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Folder className="h-5 w-5 text-accent" />
                        <span className="font-semibold text-base">{category}</span>
                        <Badge variant="secondary">{groupedDocuments[category].length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-3 pt-2">
                        {groupedDocuments[category].map(doc => (
                          <li key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                              <span className="truncate font-medium" title={doc.name}>{doc.name}</span>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                               <Button variant="outline" size="icon" title="View Document" onClick={() => setDocumentToPreview(doc)}>
                                 <Eye className="h-4 w-4" />
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
                              <Button variant="outline" size="icon" title="Download Document" asChild>
                                <a href={doc.url} download={doc.name} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!viewingDocument} onOpenChange={(isOpen) => { if (!isOpen) { setViewingDocument(null); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Summary: {viewingDocument?.name}</DialogTitle>
            <DialogDescription>
              View an AI-generated summary of your document in simple terms.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <h3 className="font-semibold mb-2 text-lg">AI Summary</h3>
            <ScrollArea className="h-96 border p-4 rounded-md bg-muted/20">
              {isSummarizing ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Generating Summary...</p>
                </div>
              ) : viewingDocument?.summary ? (
                <pre className="whitespace-pre-wrap text-sm">{viewingDocument.summary}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-muted-foreground">No summary available for this document.</p>
                  <p className="text-xs text-muted-foreground mt-2">Use the "Scan and Summarize" feature to generate one.</p>
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={!!documentToPreview} onOpenChange={(isOpen) => !isOpen && setDocumentToPreview(null)}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{documentToPreview?.name}</DialogTitle>
            <DialogDescription>
              Document Preview
            </DialogDescription>
          </DialogHeader>
          <div className="h-full py-4">
             {documentToPreview?.url && (
                <iframe src={documentToPreview.url} className="w-full h-full border rounded-md" title={documentToPreview.name} />
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
