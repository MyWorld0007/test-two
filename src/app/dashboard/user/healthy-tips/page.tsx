
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateHealthyTips, type HealthyTipsOutput } from '@/ai/flows/generate-healthy-tips-flow';
import type { EndUserProfile } from '@/lib/types';
import { Lightbulb, Loader2, Sparkles, Dumbbell, Utensils, CalendarDays, ListX, HeartPulse, ShieldAlert, Calendar } from 'lucide-react';
import { PageTitle } from '@/components/common/PageTitle';

export default function HealthyTipsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tips, setTips] = useState<HealthyTipsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (user?.role !== 'enduser') return null;

  const userProfile = user.profile as EndUserProfile;

  const handleGenerateTips = async () => {
    if (!userProfile.diseName || !userProfile.age || !userProfile.gender) {
      toast({
        title: 'Profile Incomplete',
        description: 'Please ensure your Disease Name, Age, and Gender are filled out in your profile to get tips.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setTips(null);
    toast({ title: 'Generating Healthy Tips', description: 'The AI is creating personalized recommendations for you...' });

    try {
      const result = await generateHealthyTips({
        diseaseName: userProfile.diseName,
        stage: userProfile.stage || 'Not specified',
        age: userProfile.age,
        gender: userProfile.gender,
      });
      setTips(result);
      toast({ title: 'Tips Generated!', description: 'Your personalized health tips are ready.' });
    } catch (error) {
      console.error('Failed to generate healthy tips:', error);
      toast({
        title: 'Error',
        description: 'Could not generate tips. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderExerciseList = (items: string[]) => (
    <ul className="list-disc pl-6 space-y-2 text-sm">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  );
  
  const renderThingsToAvoidList = (items: string[]) => (
     <div className="mt-6">
        <h4 className="font-semibold mb-2 flex items-center"><ListX className="mr-2 h-4 w-4 text-destructive"/> Things to Avoid</h4>
        <ul className="list-disc pl-6 space-y-2 text-sm">
         {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
     </div>
  );

  return (
    <>
      <PageTitle title="AI Healthy Tips" description="Get personalized health and wellness tips based on your profile." />
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><HeartPulse className="mr-2 h-5 w-5 text-primary" /> Your Personalized Tips</CardTitle>
          <CardDescription>
            Get AI-powered health and wellness tips based on your profile information. Click the button to start.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateTips} disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {tips ? 'Regenerate Tips' : 'Generate My Healthy Tips'}
          </Button>

           {isLoading && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-muted-foreground">The AI is analyzing your profile...</p>
              </div>
          )}

          {!tips && !isLoading && (
            <div className="text-center p-6 border-2 border-dashed rounded-lg mt-4">
              <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Your personalized tips for diet and exercise will appear here.</p>
            </div>
          )}

          {tips && (
            <div className="pt-4 animate-in fade-in-50 duration-500">
                <Alert variant="destructive" className="mb-6">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Important Disclaimer</AlertTitle>
                  <AlertDescription>
                    First consult your doctor before starting any new exercise or diet plan. This is AI-generated advice and not a medical prescription.
                  </AlertDescription>
                </Alert>

               <Tabs defaultValue="exercise" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="exercise"><Dumbbell className="mr-2 h-4 w-4"/> Exercise</TabsTrigger>
                    <TabsTrigger value="diet"><Utensils className="mr-2 h-4 w-4"/> Diet</TabsTrigger>
                </TabsList>
                <TabsContent value="exercise" className="p-4 border rounded-md mt-2">
                   <h3 className="text-lg font-semibold mb-3">Recommended Exercises</h3>
                   {renderExerciseList(tips.exerciseTips)}
                   {renderThingsToAvoidList(tips.thingsToAvoid)}
                </TabsContent>
                <TabsContent value="diet" className="p-4 border rounded-md mt-2">
                    <Tabs defaultValue="daily" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        </TabsList>
                        <TabsContent value="daily" className="mt-4">
                           <h3 className="text-lg font-semibold mb-3">Daily Diet Suggestions</h3>
                            <div className="space-y-2 text-sm">
                                <p><strong>Breakfast:</strong> {tips.dailyDiet.breakfast}</p>
                                <p><strong>Lunch:</strong> {tips.dailyDiet.lunch}</p>
                                <p><strong>Dinner:</strong> {tips.dailyDiet.dinner}</p>
                                <p><strong>Snacks:</strong> {tips.dailyDiet.snacks}</p>
                            </div>
                        </TabsContent>
                         <TabsContent value="weekly" className="mt-4">
                           <h3 className="text-lg font-semibold mb-3">Sample Weekly Plan</h3>
                           <ul className="space-y-3 text-sm">
                            {tips.weeklyDietPlan.map((dayPlan) => (
                                <li key={dayPlan.day} className="flex gap-4 items-start">
                                <strong className="w-24 flex-shrink-0 text-right">{dayPlan.day}:</strong>
                                <span>{dayPlan.meals}</span>
                                </li>
                            ))}
                            </ul>
                        </TabsContent>
                        <TabsContent value="monthly" className="mt-4">
                            <h3 className="text-lg font-semibold mb-3">Monthly Dietary Focus</h3>
                            <ul className="space-y-3 text-sm">
                                {tips.monthlyDietPlan.map((weekPlan) => (
                                <li key={weekPlan.week} className="flex gap-4 items-start">
                                    <strong className="w-24 flex-shrink-0 text-right">{weekPlan.week}:</strong>
                                    <span>{weekPlan.focus}</span>
                                </li>
                                ))}
                            </ul>
                        </TabsContent>
                    </Tabs>
                    {renderThingsToAvoidList(tips.thingsToAvoid)}
                </TabsContent>
               </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
