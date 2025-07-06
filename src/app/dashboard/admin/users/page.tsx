'use client';
import { PageTitle } from '@/components/common/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Loader2, User, Briefcase, Shield } from 'lucide-react';
import { getAllEndUsers, getAllConsultants, getAllAdmins } from '@/lib/firestore';
import type { EndUserProfile, ConsultantProfile, AdminProfile, UserRole } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function AdminManageUsersPage() {
  const [endUsers, setEndUsers] = useState<EndUserProfile[]>([]);
  const [consultants, setConsultants] = useState<ConsultantProfile[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const [endUsersData, consultantsData, adminsData] = await Promise.all([
          getAllEndUsers(),
          getAllConsultants(),
          getAllAdmins(),
        ]);
        setEndUsers(endUsersData);
        setConsultants(consultantsData);
        setAdmins(adminsData);
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

  const handleDeleteUser = (userId: string, role: UserRole) => {
     if (confirm(`Are you sure you want to delete this user? This cannot be undone.`)) {
      if (role === 'enduser') {
        setEndUsers(prev => prev.filter(u => u.userId !== userId));
      } else if (role === 'consultant') {
        setConsultants(prev => prev.filter(c => c.consultantId !== userId));
      } else if (role === 'admin') {
        setAdmins(prev => prev.filter(a => a.adminId !== userId));
      }
      alert(`User ${userId} deleted. (Client-side only)`);
    }
  };

  const handleViewUser = (userId: string) => {
    alert(`View user: ${userId} (not implemented)`);
  };


  return (
    <>
      <PageTitle title="Manage Users" description="View and manage all user profiles across the platform." />
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="endusers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="endusers"><User className="mr-2 h-4 w-4"/> End Users</TabsTrigger>
                <TabsTrigger value="consultants"><Briefcase className="mr-2 h-4 w-4"/> Consultants</TabsTrigger>
                <TabsTrigger value="admins"><Shield className="mr-2 h-4 w-4"/> Admins</TabsTrigger>
            </TabsList>

            <TabsContent value="endusers" className="mt-4">
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
                            <TableHead>Gender</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {endUsers.map((user) => (
                            <TableRow key={user.userId}>
                                <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell><Badge variant="secondary">{user.uniqueId}</Badge></TableCell>
                                <TableCell>{user.gender}</TableCell>
                                <TableCell>{user.phone}</TableCell>
                                <TableCell>{user.age}</TableCell>
                                <TableCell>
                                    {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleViewUser(user.userId)} title="View User">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.userId)} title="Edit User">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(user.userId, 'enduser')} title="Delete User">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                         {endUsers.length === 0 && <p className="text-center text-muted-foreground py-4">No end users found.</p>}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="consultants" className="mt-4">
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
                            <TableHead>Qualification</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {consultants.map((consultant) => (
                            <TableRow key={consultant.consultantId}>
                                <TableCell className="font-medium">{`${consultant.firstName} ${consultant.lastName}`}</TableCell>
                                <TableCell>{consultant.email}</TableCell>
                                <TableCell>{consultant.specializationField}</TableCell>
                                <TableCell>{consultant.qualification}</TableCell>
                                <TableCell>
                                    {consultant.lastLoginAt ? format(new Date(consultant.lastLoginAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleViewUser(consultant.consultantId)} title="View Consultant">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditUser(consultant.consultantId)} title="Edit Consultant">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(consultant.consultantId, 'consultant')} title="Delete Consultant">
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
            </TabsContent>

            <TabsContent value="admins" className="mt-4">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>All Admins</CardTitle>
                        <CardDescription>A list of all administrators in the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin) => (
                            <TableRow key={admin.adminId}>
                                <TableCell className="font-medium">{admin.name}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>
                                    {admin.lastLoginAt ? format(new Date(admin.lastLoginAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleViewUser(admin.adminId)} title="View Admin">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditUser(admin.adminId)} title="Edit Admin">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(admin.adminId, 'admin')} title="Delete Admin">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                         {admins.length === 0 && <p className="text-center text-muted-foreground py-4">No admins found.</p>}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      )}
    </>
  );
}
