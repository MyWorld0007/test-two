'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { getAllEndUsers } from '@/lib/firestore';
import type { EndUserProfile } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AdminManageUsersPage() {
  const [users, setUsers] = useState<EndUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const endUserProfiles = await getAllEndUsers();
        setUsers(endUserProfiles);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
          title: "Error",
          description: "Could not load user data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  const handleEditUser = (userId: string) => {
    alert(`Edit user: ${userId} (not implemented)`);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm(`Are you sure you want to delete user ${userId}? This cannot be undone.`)) {
      // In a real app, you would call a Firestore delete function here.
      setUsers(prevUsers => prevUsers.filter(user => user.userId !== userId));
      alert(`User ${userId} deleted. (Client-side only)`);
    }
  };

  const handleViewUser = (userId: string) => {
    alert(`View user: ${userId} (not implemented)`);
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
                  <TableHead>Unique ID</TableHead>
                  <TableHead>Approved Access</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const approvedCount = user.accessRequests?.filter(r => r.status === 'approved').length || 0;
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
          )}
          {!isLoading && users.length === 0 && <p className="text-center text-muted-foreground py-4">No end users found.</p>}
        </CardContent>
      </Card>
    </>
  );
}
