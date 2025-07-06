'use client';

import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/common/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getInsurancePolicies } from '@/lib/firestore';
import type { InsurancePolicy } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Eye, CheckCircle, Loader2 } from 'lucide-react';

export default function UserInsurancePage() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documentToPreview, setDocumentToPreview] = useState<InsurancePolicy | null>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      setIsLoading(true);
      try {
        const fetchedPolicies = await getInsurancePolicies();
        setPolicies(fetchedPolicies);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
        toast({ title: "Error", description: "Could not load insurance policies.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicies();
  }, [toast]);

  const handleInterested = (policy: InsurancePolicy) => {
    toast({
      title: "Interest Expressed",
      description: `Thank you for your interest in the ${policy.policyType} from ${policy.companyName}. Our team will get in touch with you shortly.`,
    });
  };
  
  const handleViewDocument = (policy: InsurancePolicy) => {
    setDocumentToPreview(policy);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Explore Insurance" description="Browse available health insurance plans and express your interest." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((policy) => (
          <Card key={policy.id} className="shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle>{policy.companyName}</CardTitle>
              <CardDescription>{policy.policyType}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(policy.insuredAmount)}
              </p>
              <p className="text-sm text-muted-foreground">Insured Amount</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" className="w-full" onClick={() => handleViewDocument(policy)}>
                <Eye className="mr-2 h-4 w-4" /> View Policy
              </Button>
              <Button className="w-full" onClick={() => handleInterested(policy)}>
                <CheckCircle className="mr-2 h-4 w-4" /> I'm Interested
              </Button>
            </CardFooter>
          </Card>
        ))}
        {policies.length === 0 && (
            <p className="text-center text-muted-foreground py-4 col-span-full">
                No insurance policies are available at the moment.
            </p>
        )}
      </div>

       <Dialog open={!!documentToPreview} onOpenChange={(isOpen) => !isOpen && setDocumentToPreview(null)}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{documentToPreview?.policyDocument.name}</DialogTitle>
            <DialogDescription>
              Policy Document for {documentToPreview?.companyName} - {documentToPreview?.policyType}
            </DialogDescription>
          </DialogHeader>
          <div className="h-full py-4">
             {documentToPreview?.policyDocument.dataUri && (
                <iframe src={documentToPreview.policyDocument.dataUri} className="w-full h-full border rounded-md" title={documentToPreview.policyDocument.name} />
             )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
