
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import type { EndUserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { translations } from '@/lib/translations';
import { indianStates } from '@/lib/indianStates';

const profileSchema = z.object({
  uniqueId: z.string().optional(), // Added for display, will be disabled
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional(), // Email might not be editable
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  age: z.coerce.number().int().min(1, 'Age must be a positive number').max(120),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodType: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  diseName: z.string().optional(),
  stage: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function UserProfileForm() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const getSafeProfileDefaults = (profile?: EndUserProfile): ProfileFormValues => {
    return {
      uniqueId: profile?.uniqueId || '',
      firstName: profile?.firstName || '',
      middleName: profile?.middleName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      age: profile?.age || 0,
      gender: profile?.gender || 'Other',
      bloodType: profile?.bloodType || '',
      state: profile?.state || '',
      city: profile?.city || '',
      diseName: profile?.diseName || '',
      stage: profile?.stage || '',
      preferredLanguage: profile?.preferredLanguage || 'English',
    };
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: getSafeProfileDefaults(
      user?.role === 'enduser' ? (user.profile as EndUserProfile) : undefined
    ),
  });
  
  const selectedLanguage = form.watch('preferredLanguage') as keyof typeof translations || 'English';
  const t = translations[selectedLanguage]?.userProfile || translations.English.userProfile;
  const selectedState = form.watch('state');

  useEffect(() => {
    if (user?.role === 'enduser') {
      form.reset(getSafeProfileDefaults(user.profile as EndUserProfile));
    }
  }, [user, form, isEditing]); // Add isEditing to dependencies to reset form on cancel

  useEffect(() => {
    // When the state changes, reset the city field if it's no longer valid for the new state
    const currentStateData = indianStates.find(s => s.name === selectedState);
    const currentCity = form.getValues('city');
    if (currentStateData && !currentStateData.cities.includes(currentCity || '')) {
      form.setValue('city', '');
    }
  }, [selectedState, form]);

  if (user?.role !== 'enduser') {
    return <p>Invalid user role for this form.</p>;
  }

  const onSubmit = (data: ProfileFormValues) => {
    try {
      const { uniqueId, ...restOfData } = data; // Exclude uniqueId from submission data
      const updatedProfileData = {
        ...(user.profile as EndUserProfile), 
        ...restOfData, 
      };
      updateUserProfile(updatedProfileData);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      setIsEditing(false); 
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLanguageChange = async (language: string) => {
    if (!user || user.role !== 'enduser') return;

    try {
      await updateUserProfile({ preferredLanguage: language });
      toast({
        title: 'Language Updated',
        description: `Your preferred language has been saved as ${language}.`,
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not save your language preference.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Form reset is handled by useEffect
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{t.cardTitle}</CardTitle>
        <CardDescription>{t.cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="uniqueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.uniqueId}</FormLabel>
                    <FormControl><Input {...field} disabled /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.firstName}</FormLabel>
                    <FormControl><Input {...field} disabled={!isEditing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.middleName}</FormLabel>
                    <FormControl><Input {...field} disabled={!isEditing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.lastName}</FormLabel>
                    <FormControl><Input {...field} disabled={!isEditing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.email}</FormLabel>
                    <FormControl><Input {...field} disabled placeholder='Email cannot be changed' /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.phone}</FormLabel>
                    <FormControl><Input type="tel" {...field} disabled={!isEditing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.age}</FormLabel>
                    <FormControl><Input type="number" {...field} disabled={!isEditing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.gender}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectGender} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">{t.male}</SelectItem>
                        <SelectItem value="Female">{t.female}</SelectItem>
                        <SelectItem value="Other">{t.other}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="bloodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.bloodType}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectBloodType} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bloodGroups.map(group => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.state}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectState} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {indianStates.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.city}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing || !selectedState}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedState ? "Select a state first" : t.selectCity} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {indianStates.find(s => s.name === selectedState)?.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="diseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.diseName}</FormLabel>
                    <FormControl><Input {...field} disabled={!isEditing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.stage}</FormLabel>
                    <FormControl><Input {...field} disabled={!isEditing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>{t.preferredLanguage}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleLanguageChange(value);
                        }}
                        value={field.value}
                      >
                      <FormControl>
                          <SelectTrigger>
                          <SelectValue placeholder={t.selectLanguage} />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Hindi">Hindi (हिन्दी)</SelectItem>
                          <SelectItem value="Bengali">Bengali (বাংলা)</SelectItem>
                          <SelectItem value="Marathi">Marathi (मराठी)</SelectItem>
                          <SelectItem value="Telugu">Telugu (తెలుగు)</SelectItem>
                          <SelectItem value="Tamil">Tamil (தமிழ்)</SelectItem>
                          <SelectItem value="Gujarati">Gujarati (ગુજરાતી)</SelectItem>
                          <SelectItem value="Kannada">Kannada (ಕನ್ನಡ)</SelectItem>
                          <SelectItem value="Malayalam">Malayalam (മലയാളം)</SelectItem>
                          <SelectItem value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</SelectItem>
                      </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            </div>
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t.saveChanges}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  {t.editProfile}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
