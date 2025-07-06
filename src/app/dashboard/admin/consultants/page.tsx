'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { getAllUsers } from '@/lib/firestore';
import type { ConsultantProfile } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AdminManageConsultantsPage() {
  const [consultants, setConsultants] = useState<ConsultantProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConsultants = async () => {
      setIsLoading(true);
      try {
        const allUsers = await getAllUsers();
        const consultantProfiles = allUsers.filter(u => 'consultantId' in u) as ConsultantProfile[];
        setConsultants(consultantProfiles);
      } catch (error) {
        console.error("Failed to fetch consultants:", error);
        toast({
          title: "Error",
          description: "Could not load consultant data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchConsultants();
  }, [toast]);


  const handleEditConsultant = (consultantId: string) => {
    alert(`Edit consultant: ${consultantId} (not implemented)`);
  };

  const handleDeleteConsultant = (consultantId: string) => {
     if (confirm(`Are you sure you want to delete consultant ${consultantId}? This cannot be undone.`)) {
      // In a real app, you would call a Firestore delete function here.
      setConsultants(prevConsultants => prevConsultants.filter(c => c.consultantId !== consultantId));
      alert(`Consultant ${consultantId} deleted. (Client-side only)`);
    }
  };

  const handleViewConsultant = (consultantId: string) => {
    alert(`View consultant: ${consultantId} (not implemented)`);
  };

  return (
    <>
      <PageTitle title="Manage Consultants" description="View, edit, or delete Consultant profiles." />
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Consultants</CardTitle>
          <CardDescription>A list of all registered consultants in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Users Attended</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultants.map((consultant) => (
                  <TableRow key={consultant.consultantId}>
                    <TableCell className="font-medium">{`${consultant.firstName} ${consultant.lastName}`}</TableCell>
                    <TableCell>{consultant.email}</TableCell>
                    <TableCell>{consultant.specializationField}</TableCell>
                    <TableCell>{consultant.attendedUsers?.length || 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewConsultant(consultant.consultantId)} title="View Consultant">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditConsultant(consultant.consultantId)} title="Edit Consultant">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteConsultant(consultant.consultantId)} title="Delete Consultant">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
           {!isLoading && consultants.length === 0 && <p className="text-center text-muted-foreground py-4">No consultants found.</p>}
        </CardContent>
      </Card>
    </>
  );
}