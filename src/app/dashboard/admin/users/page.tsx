'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { endUserProfiles as mockEndUserProfiles } from '@/lib/mockData'; // Using mock data
import type { EndUserProfile } from '@/lib/types';
import { useState } from 'react';

export default function AdminManageUsersPage() {
  // For a real app, this data would come from an API and be managed with state/context
  const [users, setUsers] = useState<EndUserProfile[]>(mockEndUserProfiles);

  const handleEditUser = (userId: string) => {
    // Placeholder for edit functionality
    alert(`Edit user: ${userId}`);
  };

  const handleDeleteUser = (userId: string) => {
    // Placeholder for delete functionality
    if (confirm(`Are you sure you want to delete user ${userId}? This cannot be undone.`)) {
      setUsers(prevUsers => prevUsers.filter(user => user.userId !== userId));
      alert(`User ${userId} deleted.`);
    }
  };

  const handleViewUser = (userId: string) => {
    // Placeholder for view functionality
    alert(`View user: ${userId}`);
  };


  return (
    <>
      <PageTitle title="Manage End Users" description="View, edit, or delete End User profiles." />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All End Users</CardTitle>
          <CardDescription>A list of all registered end users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Unique ID</TableHead>
                <TableHead>Approved Access</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const approvedCount = user.accessRequests.filter(r => r.status === 'approved').length;
                return (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="secondary">{user.uniqueId}</Badge></TableCell>
                    <TableCell>{approvedCount}</TableCell>
                    <TableCell>{user.gender}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewUser(user.userId)} title="View User">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.userId)} title="Edit User">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(user.userId)} title="Delete User">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {users.length === 0 && <p className="text-center text-muted-foreground py-4">No end users found.</p>}
        </CardContent>
      </Card>
    </>
  );
}
