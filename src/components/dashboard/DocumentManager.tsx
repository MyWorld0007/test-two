'use client';

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import type { Document as DocumentType, EndUserProfile, DocumentCategory, StructuredDocumentSummary } from '@/lib/types';
import { scanDocument } from '@/ai/flows/scan-document';
import { useToast } from '@/hooks/use-toast';
import { FileText, UploadCloud, Edit2, Trash2, Loader2, Download, FileJson2, Folder, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { translations } from '@/lib/translations';
import { Separator } from '../ui/separator';

export function DocumentManager() {
  const { user, addDocument, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentType | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentType | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [documentToPreview, setDocumentToPreview] = useState<DocumentType | null>(null);

  const documents: DocumentType[] = (user?.role === 'enduser' && (user.profile as EndUserProfile).documents) ? (user.profile as EndUserProfile).documents : [];

  if (user?.role !== 'enduser') {
    return <p>Document management is only available for End Users.</p>;
  }
  const userProfile = user.profile as EndUserProfile;
  const preferredLanguage = userProfile?.preferredLanguage as keyof typeof translations || 'English';
  const t = translations[preferredLanguage]?.docManager || translations.English.docManager;

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
        const dataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile!);
        });

        const scanResult = await scanDocument({ documentDataUri: dataUri });

        const newDocument: DocumentType = {
          id: `doc_${Date.now()}`,
          name: selectedFile.name,
          dataUri: dataUri,
          uploadedAt: new Date().toISOString(),
          category: scanResult.category,
          extractedText: scanResult.extractedText,
          summary: scanResult,
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
        toast({ title: "Processing Failed", description: (error as Error).message || "Could not process the document. File may be too large.", variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleSummarize = async (doc: DocumentType) => {
    setIsSummarizing(true);
    setViewingDocument(doc); // Open the dialog immediately

    try {
      // The summary is now part of the initial scan, so we just need to ensure it exists.
      // If not, we re-scan to generate it.
      if (!doc.summary || !doc.extractedText) {
         toast({ title: "Generating Summary...", description: "Please wait while the AI analyzes your document." });
         const scanResult = await scanDocument({ documentDataUri: doc.dataUri });
         const updatedDoc = { ...doc, summary: scanResult, extractedText: scanResult.extractedText, category: scanResult.category };
         
         const finalUpdatedDocs = documents.map((d) =>
            d.id === doc.id ? updatedDoc : d
         );
         await updateUserProfile({ documents: finalUpdatedDocs });
         setViewingDocument(updatedDoc); // Update the dialog with the new data
         toast({ title: 'Summary Generated', description: 'The document has been successfully summarized.'});
      }
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
  
  const renderSummary = (summary: StructuredDocumentSummary) => (
    <div className="space-y-3 text-sm">
        <div className="flex">
            <strong className="w-40 flex-shrink-0">{'Clinic / Lab Name:'}</strong>
            <span>{summary.instituteName}</span>
        </div>
        <Separator/>
        <div className="flex">
            <strong className="w-40 flex-shrink-0">{'Patient Name:'}</strong>
            <span>{summary.patientName}</span>
        </div>
        <Separator/>
        <div className="flex">
            <strong className="w-40 flex-shrink-0">{'Age:'}</strong>
            <span>{summary.age}</span>
        </div>
        <Separator/>
        <div className="flex">
            <strong className="w-40 flex-shrink-0">{'Gender:'}</strong>
            <span>{summary.gender}</span>
        </div>
        <Separator/>
        <div className="space-y-1">
            <strong className="w-40 flex-shrink-0">{'Treatment / Test Name:'}</strong>
            <p className="pt-1">{summary.testName}</p>
        </div>
        <Separator/>
        <div className="space-y-1">
            <strong className="w-40 flex-shrink-0">{'Outcome:'}</strong>
            <p className="pt-1 whitespace-pre-wrap">{summary.outcome}</p>
        </div>
         <Separator/>
        <div className="space-y-1">
            <strong className="w-40 flex-shrink-0">{'Other Findings:'}</strong>
            <p className="pt-1 whitespace-pre-wrap">{summary.otherInfo}</p>
        </div>
    </div>
);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t.uploadTitle}</CardTitle>
          <CardDescription>{t.uploadDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <Input id="file-upload" type="file" onChange={handleFileChange} className="flex-grow" aria-label="Choose file"/>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {t.uploadButton}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t.myDocsTitle}</CardTitle>
          <CardDescription>{t.myDocsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t.noDocs}</p>
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
                               <Button variant="outline" size="icon" title={t.viewButton} onClick={() => setDocumentToPreview(doc)}>
                                 <Eye className="h-4 w-4" />
                               </Button>
                              <Button variant="outline" size="icon" title="Summarize" onClick={() => handleSummarize(doc)}>
                                <FileJson2 className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" title={t.renameButton} onClick={() => { setEditingDocument(doc); setNewFileName(doc.name); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" title={t.deleteButton}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t.deleteDialogTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t.deleteDialogDescription} "{doc.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t.cancelButton}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteDocument(doc.id)}>{t.deleteConfirmButton}</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button variant="outline" size="icon" title={t.downloadButton} asChild>
                                <a href={doc.dataUri} download={doc.name} target="_blank" rel="noopener noreferrer">
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Structured Summary: {viewingDocument?.name}</DialogTitle>
            <DialogDescription>
              This is an AI-generated summary of the document's content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <div className="border p-4 rounded-md bg-muted/20">
              {isSummarizing ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Analyzing Document...</p>
                </div>
              ) : viewingDocument?.summary ? (
                renderSummary(viewingDocument.summary)
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                  <p className="text-muted-foreground">No summary available.</p>
                  <p className="text-xs text-muted-foreground mt-2">Click the "Summarize" button again to generate one.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline">{t.closeButton}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDocument} onOpenChange={(isOpen) => !isOpen && setEditingDocument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.renameDialogTitle}</DialogTitle>
            <DialogDescription>{t.renameDialogDescription} "{editingDocument?.name}".</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-name" className="text-right">{t.renameDialogLabel}</Label>
              <Input id="doc-name" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t.cancelButton}</Button></DialogClose>
            <Button onClick={handleRenameDocument}>{t.saveButton}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!documentToPreview} onOpenChange={(isOpen) => !isOpen && setDocumentToPreview(null)}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{documentToPreview?.name}</DialogTitle>
            <DialogDescription>
              {t.previewDialogTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="h-full py-4">
             {documentToPreview?.dataUri && (
                <iframe src={documentToPreview.dataUri} className="w-full h-full border rounded-md" title={documentToPreview.name} />
             )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t.closeButton}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
