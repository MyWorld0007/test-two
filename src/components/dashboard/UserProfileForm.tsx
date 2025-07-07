
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

const profileSchema = z.object({
  uniqueId: z.string().optional(), // Added for display, will be disabled
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional(), // Email might not be editable
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  age: z.coerce.number().int().min(1, 'Age must be a positive number').max(120),
  gender: z.enum(['Male', 'Female', 'Other']),
  diseName: z.string().optional(),
  stage: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const translations = {
  English: {
    cardTitle: 'My Profile',
    cardDescription: 'View and update your personal information.',
    uniqueId: 'Unique ID',
    firstName: 'First Name',
    middleName: 'Middle Name (Optional)',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone Number',
    age: 'Age',
    gender: 'Gender',
    selectGender: 'Select gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    diseName: 'DISE Name (Optional)',
    stage: 'Stage (Optional)',
    preferredLanguage: 'Preferred Language',
    selectLanguage: 'Select language',
    editProfile: 'Edit Profile',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
  },
  Hindi: {
    cardTitle: 'मेरी प्रोफ़ाइल',
    cardDescription: 'अपनी व्यक्तिगत जानकारी देखें और अपडेट करें।',
    uniqueId: 'अद्वितीय आईडी',
    firstName: 'पहला नाम',
    middleName: 'मध्य नाम (वैकल्पिक)',
    lastName: 'अंतिम नाम',
    email: 'ईमेल',
    phone: 'फ़ोन नंबर',
    age: 'आयु',
    gender: 'लिंग',
    selectGender: 'लिंग चुनें',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    diseName: 'DISE नाम (वैकल्पिक)',
    stage: 'चरण (वैकल्पिक)',
    preferredLanguage: 'पसंदीदा भाषा',
    selectLanguage: 'भाषा चुनें',
    editProfile: 'प्रोफ़ाइल संपादित करें',
    cancel: 'रद्द करें',
    saveChanges: 'बदलाव सहेजें',
  },
  Bengali: {
    cardTitle: 'আমার প্রোফাইল',
    cardDescription: 'আপনার ব্যক্তিগত তথ্য দেখুন এবং আপডেট করুন।',
    uniqueId: 'অনন্য আইডি',
    firstName: 'নামের প্রথম অংশ',
    middleName: 'মধ্য নাম (ঐচ্ছিক)',
    lastName: 'পদবি',
    email: 'ইমেল',
    phone: 'ফোন নম্বর',
    age: 'বয়স',
    gender: 'লিঙ্গ',
    selectGender: 'লিঙ্গ নির্বাচন করুন',
    male: 'পুরুষ',
    female: 'মহিলা',
    other: 'অন্যান্য',
    diseName: 'DISE নাম (ঐচ্ছিক)',
    stage: 'পর্যায় (ঐচ্ছিক)',
    preferredLanguage: 'পছন্দের ভাষা',
    selectLanguage: 'ভাষা নির্বাচন করুন',
    editProfile: 'প্রোফাইল সম্পাদনা করুন',
    cancel: 'বাতিল করুন',
    saveChanges: 'পরিবর্তনগুলি সংরক্ষণ করুন',
  },
  Marathi: {
    cardTitle: 'माझे प्रोफाइल',
    cardDescription: 'तुमची वैयक्तिक माहिती पहा आणि अपडेट करा.',
    uniqueId: 'युनिक आयडी',
    firstName: 'पहिले नाव',
    middleName: 'मधले नाव (पर्यायी)',
    lastName: 'आडनाव',
    email: 'ईमेल',
    phone: 'फोन नंबर',
    age: 'वय',
    gender: 'लिंग',
    selectGender: 'लिंग निवडा',
    male: 'पुरुष',
    female: 'महिला',
    other: 'इतर',
    diseName: 'DISE नाव (पर्यायी)',
    stage: 'टप्पा (पर्यायी)',
    preferredLanguage: 'पसंतीची भाषा',
    selectLanguage: 'भाषा निवडा',
    editProfile: 'प्रोफाइल संपादित करा',
    cancel: 'रद्द करा',
    saveChanges: 'बदल जतन करा',
  },
  Telugu: {
    cardTitle: 'నా ప్రొఫైల్',
    cardDescription: 'మీ వ్యక్తిగత సమాచారాన్ని వీక్షించండి మరియు నవీకరించండి.',
    uniqueId: 'ప్రత్యేక ఐడి',
    firstName: 'మొదటి పేరు',
    middleName: 'మధ్య పేరు (ఐచ్ఛికం)',
    lastName: 'ఇంటిపేరు',
    email: 'ఇమెయిల్',
    phone: 'ఫోన్ నంబర్',
    age: 'వయస్సు',
    gender: 'లింగం',
    selectGender: 'లింగాన్ని ఎంచుకోండి',
    male: 'పురుషుడు',
    female: 'స్త్రీ',
    other: 'ఇతర',
    diseName: 'DISE పేరు (ఐచ్ఛికం)',
    stage: 'దశ (ఐచ్ఛికం)',
    preferredLanguage: 'ప్రాధాన్య భాష',
    selectLanguage: 'భాషను ఎంచుకోండి',
    editProfile: 'ప్రొఫైల్‌ను సవరించండి',
    cancel: 'రద్దు చేయండి',
    saveChanges: 'మార్పులను భద్రపరచండి',
  },
  Tamil: {
    cardTitle: 'எனது சுயவிவரம்',
    cardDescription: 'உங்கள் தனிப்பட்ட தகவல்களைக் கண்டு புதுப்பிக்கவும்.',
    uniqueId: 'தனிப்பட்ட அடையாளங்காட்டி',
    firstName: 'முதல் பெயர்',
    middleName: 'நடுப் பெயர் (விருப்பத்திற்குரியது)',
    lastName: 'கடைசி பெயர்',
    email: 'மின்னஞ்சல்',
    phone: 'தொலைபேசி எண்',
    age: 'வயது',
    gender: 'பாலினம்',
    selectGender: 'பாலினத்தைத் தேர்ந்தெடுக்கவும்',
    male: 'ஆண்',
    female: 'பெண்',
    other: 'மற்றவை',
    diseName: 'DISE பெயர் (விருப்பத்திற்குரியது)',
    stage: 'நிலை (விருப்பத்திற்குரியது)',
    preferredLanguage: 'விருப்ப மொழி',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    editProfile: 'சுயவிவரத்தைத் திருத்து',
    cancel: 'ரத்துசெய்',
    saveChanges: 'மாற்றங்களைச் சேமிக்கவும்',
  },
  Gujarati: {
    cardTitle: 'મારી પ્રોફાઇલ',
    cardDescription: 'તમારી વ્યક્તિગત માહિતી જુઓ અને અપડેટ કરો.',
    uniqueId: 'અનન્ય આઈડી',
    firstName: 'પહેલું નામ',
    middleName: 'વચલું નામ (વૈકલ્પિક)',
    lastName: 'છેલ્લું નામ',
    email: 'ઈમેલ',
    phone: 'ફોન નંબર',
    age: 'ઉંમર',
    gender: 'જાતિ',
    selectGender: 'જાતિ પસંદ કરો',
    male: 'પુરુષ',
    female: 'સ્ત્રી',
    other: 'અન્ય',
    diseName: 'DISE નામ (વૈકલ્પિક)',
    stage: 'તબક્કો (વૈકલ્પિક)',
    preferredLanguage: 'પસંદગીની ભાષા',
    selectLanguage: 'ભાષા પસંદ કરો',
    editProfile: 'પ્રોફાઇલ સંપાદિત કરો',
    cancel: 'રદ કરો',
    saveChanges: 'ફેરફારો સાચવો',
  },
  Kannada: {
    cardTitle: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    cardDescription: 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ನವೀಕರಿಸಿ.',
    uniqueId: 'ವಿಶಿಷ್ಟ ಐಡಿ',
    firstName: 'ಮೊದಲ ಹೆಸರು',
    middleName: 'ಮಧ್ಯದ ಹೆಸರು (ಐಚ್ಛಿಕ)',
    lastName: 'ಕೊನೆಯ ಹೆಸರು',
    email: 'ಇಮೇಲ್',
    phone: 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
    age: 'ವಯಸ್ಸು',
    gender: 'ಲಿಂಗ',
    selectGender: 'ಲಿಂಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    male: 'ಪುರುಷ',
    female: 'ಮಹಿಳೆ',
    other: 'ಇತರೆ',
    diseName: 'DISE ಹೆಸರು (ಐಚ್ಛಿಕ)',
    stage: 'ಹಂತ (ಐಚ್ಛಿಕ)',
    preferredLanguage: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
    selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    editProfile: 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    saveChanges: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
  },
  Malayalam: {
    cardTitle: 'എന്റെ പ്രൊഫൈൽ',
    cardDescription: 'നിങ്ങളുടെ സ്വകാര്യ വിവരങ്ങൾ കാണുക, അപ്ഡേറ്റ് ചെയ്യുക.',
    uniqueId: 'യുണീക്ക് ഐഡി',
    firstName: 'ആദ്യ പേര്',
    middleName: 'മധ്യനാമം (ഓപ്ഷണൽ)',
    lastName: 'അവസാന പേര്',
    email: 'ഇമെയിൽ',
    phone: 'ഫോൺ നമ്പർ',
    age: 'വയസ്സ്',
    gender: 'ലിംഗം',
    selectGender: 'ലിംഗം തിരഞ്ഞെടുക്കുക',
    male: 'പുരുഷൻ',
    female: 'സ്ത്രീ',
    other: 'മറ്റുള്ളവ',
    diseName: 'DISE പേര് (ഓപ്ഷണൽ)',
    stage: 'ഘട്ടം (ഓപ്ഷണൽ)',
    preferredLanguage: 'ഇഷ്ടമുള്ള ഭാഷ',
    selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    editProfile: 'പ്രൊഫൈൽ എഡിറ്റുചെയ്യുക',
    cancel: 'റദ്ദാക്കുക',
    saveChanges: 'മാറ്റങ്ങൾ സംരക്ഷിക്കുക',
  },
  Punjabi: {
    cardTitle: 'ਮੇਰੀ ਪ੍ਰੋਫਾਈਲ',
    cardDescription: 'ਆਪਣੀ ਨਿੱਜੀ ਜਾਣਕਾਰੀ ਵੇਖੋ ਅਤੇ ਅਪਡੇਟ ਕਰੋ।',
    uniqueId: 'ਵਿਲੱਖਣ ID',
    firstName: 'ਪਹਿਲਾ ਨਾਂ',
    middleName: 'ਮੱਧ ਨਾਮ (ਵਿਕਲਪਿਕ)',
    lastName: 'ਆਖਰੀ ਨਾਂ',
    email: 'ਈ - ਮੇਲ',
    phone: 'ਫੋਨ ਨੰਬਰ',
    age: 'ਉਮਰ',
    gender: 'ਲਿੰਗ',
    selectGender: 'ਲਿੰਗ ਚੁਣੋ',
    male: 'ਮਰਦ',
    female: 'ਔਰਤ',
    other: 'ਹੋਰ',
    diseName: 'DISE ਨਾਮ (ਵਿਕਲਪਿਕ)',
    stage: 'ਪੜਾਅ (ਵਿਕਲਪਿਕ)',
    preferredLanguage: 'ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ',
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    editProfile: 'ਪ੍ਰੋਫਾਈਲ ਸੋਧੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    saveChanges: 'ਬਦਲਾਅ ਸੁਰੱਖਿਅਤ ਕਰੋ',
  },
};

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
  const t = translations[selectedLanguage] || translations.English;

  useEffect(() => {
    if (user?.role === 'enduser') {
      form.reset(getSafeProfileDefaults(user.profile as EndUserProfile));
    }
  }, [user, form, isEditing]); // Add isEditing to dependencies to reset form on cancel

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
