'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { consultantProfiles as mockConsultantProfiles } from '@/lib/mockData'; // Using mock data
import type { ConsultantProfile } from '@/lib/types';
import { useState } from 'react';

export default function AdminManageConsultantsPage() {
  const [consultants, setConsultants] = useState<ConsultantProfile[]>(mockConsultantProfiles);

  const handleEditConsultant = (consultantId: string) => {
    alert(`Edit consultant: ${consultantId}`);
  };

  const handleDeleteConsultant = (consultantId: string) => {
     if (confirm(`Are you sure you want to delete consultant ${consultantId}? This cannot be undone.`)) {
      setConsultants(prevConsultants => prevConsultants.filter(c => c.consultantId !== consultantId));
      alert(`Consultant ${consultantId} deleted.`);
    }
  };

  const handleViewConsultant = (consultantId: string) => {
    alert(`View consultant: ${consultantId}`);
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
                  <TableCell>{consultant.attendedUsers.length}</TableCell>
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
           {consultants.length === 0 && <p className="text-center text-muted-foreground py-4">No consultants found.</p>}
        </CardContent>
      </Card>
    </>
  );
}
