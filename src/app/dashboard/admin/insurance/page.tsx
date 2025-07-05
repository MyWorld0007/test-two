'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageTitle } from '@/components/common/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { insurancePolicies as mockPolicies, addInsurancePolicy, deleteInsurancePolicy } from '@/lib/mockData';
import type { InsurancePolicy } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const insuranceSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  policyType: z.string().min(1, 'Policy type is required'),
  insuredAmount: z.coerce.number().positive('Insured amount must be a positive number'),
  policyDocument: z.any().refine((files) => files?.length == 1, "Policy document is required."),
});

type InsuranceFormValues = z.infer<typeof insuranceSchema>;

export default function AdminManageInsurancePage() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>(mockPolicies);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsuranceFormValues>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      companyName: '',
      policyType: '',
      insuredAmount: 0,
    },
  });

  const onSubmit = async (data: InsuranceFormValues) => {
    setIsSubmitting(true);
    const file = data.policyDocument[0];
    const fileUrl = URL.createObjectURL(file); // In a real app, you'd upload this to storage

    try {
        addInsurancePolicy({
            companyName: data.companyName,
            policyType: data.policyType,
            insuredAmount: data.insuredAmount,
            policyDocument: {
                name: file.name,
                url: fileUrl,
            },
        });

        // This is a bit of a hack for mock data. In a real app, you'd refetch.
        setPolicies([...mockPolicies]);
        
        toast({ title: "Policy Added", description: "The new insurance policy has been added successfully." });
        form.reset();
        // Reset file input
        const fileInput = document.getElementById('policyDocument') as HTMLInputElement;
        if(fileInput) fileInput.value = '';

    } catch (error) {
        toast({ title: "Error", description: "Failed to add the policy.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeletePolicy = (policyId: string) => {
    deleteInsurancePolicy(policyId);
    setPolicies(policies.filter(p => p.id !== policyId));
    toast({ title: "Policy Deleted", description: "The insurance policy has been removed." });
  };
  
  const handleViewDocument = (url: string, name: string) => {
    if (url === '#') {
      toast({ title: "Preview Not Available", description: "This is mock data and has no associated file."});
      return;
    }
    // In a real app, you'd handle this better, maybe a modal with an iframe
    window.open(url, '_blank');
  };

  return (
    <>
      <PageTitle title="Manage Insurance" description="Add, view, or remove insurance policies from the platform." />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5" /> Add New Policy</CardTitle>
                <CardDescription>Fill out the form to add a new insurance policy.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Insurance Company Name</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g., SecureHealth Inc." /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                        control={form.control}
                        name="policyType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Type of Policy</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g., Family Floater" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                        control={form.control}
                        name="insuredAmount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Insured Amount</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="policyDocument"
                        render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                            <FormLabel>Policy Document</FormLabel>
                            <FormControl>
                                <Input 
                                id="policyDocument"
                                type="file" 
                                accept=".pdf,.doc,.docx,.png,.jpg"
                                onChange={(e) => onChange(e.target.files)}
                                {...rest} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Add Policy
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Card className="shadow-lg lg:col-span-3">
            <CardHeader>
            <CardTitle>Available Insurance Policies</CardTitle>
            <CardDescription>A list of all insurance policies configured in the system.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Policy Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {policies.map((policy) => (
                    <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.companyName}</TableCell>
                    <TableCell>{policy.policyType}</TableCell>
                    <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(policy.insuredAmount)}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDocument(policy.policyDocument.url, policy.policyDocument.name)} title="View Document">
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => alert('Edit functionality not implemented yet.')} title="Edit Policy">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Policy">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the policy from {policy.companyName}.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePolicy(policy.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {policies.length === 0 && <p className="text-center text-muted-foreground py-4">No insurance policies found.</p>}
            </CardContent>
        </Card>
      </div>
    </>
  );
}
