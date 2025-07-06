'use client';
import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/common/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';

async function fetchAllDocs(collectionName: string): Promise<any[]> {
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export default function AdminDataExplorerPage() {
    const [data, setData] = useState<Record<string, any[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const collectionsToFetch = ['users', 'insurancePolicies'];

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fetchedData: Record<string, any[]> = {};
                for (const collectionName of collectionsToFetch) {
                    fetchedData[collectionName] = await fetchAllDocs(collectionName);
                }
                setData(fetchedData);
            } catch (error) {
                console.error("Failed to fetch Firestore data:", error);
                toast({
                    title: "Error",
                    description: "Could not load data from Firestore.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    return (
        <>
            <PageTitle title="Cloud Firestore Data Explorer" description="View raw data from your Firestore collections." />
            
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue={collectionsToFetch[0]} className="w-full">
                    <TabsList>
                        {collectionsToFetch.map(name => (
                            <TabsTrigger key={name} value={name}>
                                {name.charAt(0).toUpperCase() + name.slice(1)}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {collectionsToFetch.map(collectionName => (
                         <TabsContent value={collectionName} key={collectionName}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Collection: {collectionName}</CardTitle>
                                    <CardDescription>
                                        Displaying {data[collectionName]?.length || 0} documents.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {data[collectionName]?.map((doc: any) => (
                                            <AccordionItem value={doc.id} key={doc.id}>
                                                <AccordionTrigger>{doc.id}</AccordionTrigger>
                                                <AccordionContent>
                                                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                                                        {JSON.stringify(doc, null, 2)}
                                                    </pre>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                     {(!data[collectionName] || data[collectionName].length === 0) && (
                                        <p className="text-center text-muted-foreground py-4">No documents found in this collection.</p>
                                    )}
                                </CardContent>
                            </Card>
                         </TabsContent>
                    ))}
                </Tabs>
            )}
        </>
    );
}
