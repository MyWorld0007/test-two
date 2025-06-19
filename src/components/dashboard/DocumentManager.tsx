
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
import { useToast } from '@/hooks/use-toast';
import { FileText, UploadCloud, Edit2, ScanLine, Trash2, Loader2, Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DocumentManager() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
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

  const handleScanDocument = async (doc: DocumentType) => {
    if (!doc.url.startsWith('blob:')) { // Simple check if it's a local blob URL
        toast({ title: "Scan Error", description: "OCR scanning is only available for newly uploaded files in this demo.", variant: "destructive" });
        return;
    }

    setIsScanning(true);
    setOcrResult(null);
    setViewingDocument(doc); // Show OCR result in the context of this document

    try {
        // Fetch the blob data and convert to data URI
        const response = await fetch(doc.url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            try {
                const result = await scanDocument({ documentDataUri: base64data });
                setOcrResult(result.extractedText);
                // Update document with extracted text
                const updatedDocs = documents.map(d => d.id === doc.id ? {...d, extractedText: result.extractedText} : d);
                updateUserProfile({ ...userProfile, documents: updatedDocs });
                setDocuments(updatedDocs);
                toast({ title: "Scan Successful", description: "Document text extracted." });
            } catch (e) {
                console.error("OCR Error:", e);
                toast({ title: "Scan Failed", description: (e as Error).message || "Could not scan the document.", variant: "destructive" });
                setOcrResult("Failed to extract text.");
            } finally {
                setIsScanning(false);
            }
        };
    } catch (error) {
        console.error("File to Data URI Error:", error);
        toast({ title: "Scan Preparation Failed", description: "Could not prepare the document for scanning.", variant: "destructive" });
        setIsScanning(false);
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
          <CardDescription>View, manage, and scan your uploaded documents.</CardDescription>
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
                      <Button variant="outline" size="icon" title="View OCR Result / Scan" onClick={() => { setViewingDocument(doc); if(doc.extractedText) setOcrResult(doc.extractedText); else setOcrResult(null); }}>
                        <ScanLine className="h-4 w-4" />
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
      
      {/* Dialog for viewing/scanning OCR */}
      <Dialog open={!!viewingDocument} onOpenChange={(isOpen) => !isOpen && setViewingDocument(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document: {viewingDocument?.name}</DialogTitle>
            <DialogDescription>
              Extracted text from the document. You can scan it if not already done.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 my-4 border p-4 rounded-md bg-muted/20">
            {isScanning && !ocrResult && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Scanning...</p></div>}
            {ocrResult ? (
                <pre className="whitespace-pre-wrap text-sm">{ocrResult}</pre>
            ) : (
                <p className="text-muted-foreground">No OCR text available yet. Click "Scan Document" to extract text.</p>
            )}
          </ScrollArea>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            {!viewingDocument?.extractedText && (
              <Button onClick={() => viewingDocument && handleScanDocument(viewingDocument)} disabled={isScanning || !viewingDocument?.url.startsWith('blob:')}>
                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                Scan Document
              </Button>
            )}
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
