'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from '@/hooks/useAuth';
import type { ConsultantProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const consultantProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional(), // Email might not be editable
  qualification: z.string().min(1, 'Qualification is required'),
  qualificationNumber: z.string().min(1, 'Qualification number is required'),
  totalExperience: z.coerce.number().int().min(0, 'Experience must be a non-negative number'),
  specializationField: z.string().min(1, 'Specialization field is required'),
});

type ConsultantProfileFormValues = z.infer<typeof consultantProfileSchema>;

export function ConsultantProfileForm() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const defaultValues = user?.role === 'consultant' ? {
    ...(user.profile as ConsultantProfile),
    email: (user.profile as ConsultantProfile).email,
  } : {} as ConsultantProfileFormValues;

  const form = useForm<ConsultantProfileFormValues>({
    resolver: zodResolver(consultantProfileSchema),
    defaultValues,
  });

  useEffect(() => {
    if (user?.role === 'consultant') {
      form.reset(user.profile as ConsultantProfile);
    }
  }, [user, form]);

  if (user?.role !== 'consultant') {
    return <p>Invalid user role for this form.</p>;
  }

  const onSubmit = (data: ConsultantProfileFormValues) => {
    try {
      const updatedProfileData = {
        ...(user.profile as ConsultantProfile),
        ...data,
      };
      updateUserProfile(updatedProfileData);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>My Professional Profile</CardTitle>
        <CardDescription>Update your qualifications and specialization.</CardDescription>
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
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name (Optional)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} disabled placeholder="Email cannot be changed" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualification</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualificationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualification Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Experience (Years)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specializationField"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization Field</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
