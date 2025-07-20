
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateHealthyTips, type HealthyTipsOutput } from '@/ai/flows/generate-healthy-tips-flow';
import type { EndUserProfile } from '@/lib/types';
import { Lightbulb, Loader2, Sparkles, Dumbbell, Utensils, CalendarDays, ListX, HeartPulse } from 'lucide-react';

export function HealthyTips() {
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

  const renderList = (items: string[]) => (
    <ul className="list-disc pl-6 space-y-1.5 text-sm">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><HeartPulse className="mr-2 h-5 w-5 text-primary" /> Healthy Tips</CardTitle>
        <CardDescription>
          Get AI-powered health and wellness tips based on your profile information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!tips && !isLoading && (
          <div className="text-center p-4 border-2 border-dashed rounded-lg">
            <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Click the button below to generate personalized tips for diet and exercise.</p>
          </div>
        )}

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

        {tips && (
          <div className="pt-4 animate-in fade-in-50 duration-500">
            <Accordion type="multiple" defaultValue={['exercise', 'dailyDiet']}>
              <AccordionItem value="exercise">
                <AccordionTrigger><Dumbbell className="mr-2 h-4 w-4" />Exercise Routine</AccordionTrigger>
                <AccordionContent>{renderList(tips.exerciseTips)}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="dailyDiet">
                <AccordionTrigger><Utensils className="mr-2 h-4 w-4" />Daily Diet Suggestions</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Breakfast:</strong> {tips.dailyDiet.breakfast}</p>
                    <p><strong>Lunch:</strong> {tips.dailyDiet.lunch}</p>
                    <p><strong>Dinner:</strong> {tips.dailyDiet.dinner}</p>
                    <p><strong>Snacks:</strong> {tips.dailyDiet.snacks}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="weeklyDiet">
                <AccordionTrigger><CalendarDays className="mr-2 h-4 w-4" />Sample Weekly Diet Plan</AccordionTrigger>
                <AccordionContent>
                   <ul className="space-y-3 text-sm">
                    {tips.weeklyDietPlan.map((dayPlan) => (
                      <li key={dayPlan.day} className="flex gap-4">
                        <strong className="w-20 flex-shrink-0">{dayPlan.day}:</strong>
                        <span>{dayPlan.meals}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="avoid">
                <AccordionTrigger><ListX className="mr-2 h-4 w-4" />Foods & Habits to Avoid</AccordionTrigger>
                <AccordionContent>{renderList(tips.thingsToAvoid)}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
