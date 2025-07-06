'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageTitle } from '@/components/common/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createConsultantByAdmin } from '@/lib/firestore';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const createConsultantSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type FormValues = z.infer<typeof createConsultantSchema>;

export default function CreateConsultantPage() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createConsultantSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    const result = await createConsultantByAdmin(data.email, data.password, data.firstName, data.lastName);

    if (result.success) {
      toast({
        title: 'Consultant Created',
        description: `Account for ${data.email} has been created. As a security measure, you have been logged out. Please log back in.`,
      });
      await logout(); // Explicitly log out the newly created user session to complete the process securely
      router.push('/login');
    } else {
      toast({
        title: 'Creation Failed',
        description: result.message || 'An error occurred.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle title="Create Consultant Profile" description="Create a new consultant account with their credentials." />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5" /> New Consultant Form</CardTitle>
          <CardDescription>Fill in the details to create a new consultant profile. The consultant will be able to log in with these credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., Dr. Jane" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., Smith" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultant Email</FormLabel>
                    <FormControl><Input type="email" {...field} placeholder="consultant@example.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4"/>}
                  Create Consultant
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
