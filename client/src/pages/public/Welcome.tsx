/**
 * Welcome Screen - Entry point for consumer screening flow
 * Fetches program/brand data and starts screening session
 */

import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useSession } from '@/contexts/SessionContext';
import { sessionClient } from '@/lib/sessionClient';
import { ConsumerLayout } from '@/components/consumer/ConsumerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Clock, FileText, AlertCircle } from 'lucide-react';
import type { GetProgramResponse, CreateSessionResponse } from '@/types/consumer';

export default function Welcome() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { setProgramData, setSession } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programData, setProgramDataState] = useState<GetProgramResponse['data'] | null>(null);

  // Fetch program and screener data on mount
  useEffect(() => {
    const fetchProgramData = async () => {
      if (!slug) {
        setError('Invalid program link');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('[Welcome] Fetching program data for slug:', slug);

        const response = await sessionClient.get<GetProgramResponse>(`/public/programs/${slug}`);
        console.log('[Welcome] API response:', response);

        if (!response.success || !response.data) {
          console.error('[Welcome] Invalid response:', response);
          throw new Error('Failed to load screening program');
        }

        console.log('[Welcome] Program data loaded successfully:', response.data);
        setProgramDataState(response.data);
        setProgramData(
          response.data.program,
          response.data.brandConfig,
          response.data.screenerVersion.screenerJson
        );
        console.log('[Welcome] State updated, isLoading will be set to false');
      } catch (err) {
        console.error('[Welcome] Error fetching program:', err);
        setError(err instanceof Error ? err.message : 'Failed to load program');
      } finally {
        console.log('[Welcome] Setting isLoading to false');
        setIsLoading(false);
      }
    };

    fetchProgramData();
  }, [slug, setProgramData]);

  const handleStartScreening = async () => {
    if (!slug) return;

    try {
      setIsStarting(true);
      setError(null);

      const response = await sessionClient.post<CreateSessionResponse>('/public/sessions', {
        programSlug: slug,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to start screening session');
      }

      // Store session token and session data
      sessionClient.setSessionToken(response.data.sessionToken);
      setSession(
        response.data.session.id,
        response.data.sessionToken,
        response.data.session
      );

      // Navigate to screening questions
      navigate(`/screen/${slug}/questions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <ConsumerLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ConsumerLayout>
    );
  }

  if (error || !programData) {
    return (
      <ConsumerLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Program not found'}</AlertDescription>
        </Alert>
      </ConsumerLayout>
    );
  }

  return (
    <ConsumerLayout>
      <div className="space-y-6" data-testid="welcome-screen">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="welcome-title">
            Let's check if {programData.program.name} is right for you
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Answer a few quick questions to see if you qualify. It only takes about 3 minutes.
          </p>
        </div>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">What to expect</CardTitle>
            <CardDescription>
              This screening is private, secure, and designed to help you make informed decisions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Answer questions</h3>
                <p className="text-sm text-muted-foreground">
                  Simple, clear questions about your health
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Takes 3 minutes</h3>
                <p className="text-sm text-muted-foreground">
                  Quick and easy on any device
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Private & secure</h3>
                <p className="text-sm text-muted-foreground">
                  Your information stays confidential
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="w-full max-w-md h-14 text-lg font-semibold"
            onClick={handleStartScreening}
            disabled={isStarting}
            data-testid="button-start-screening"
          >
            {isStarting ? 'Starting...' : 'Start Secure Screening'}
          </Button>

          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground text-center max-w-md">
            By continuing, you agree to answer questions honestly and understand that this screening does not replace professional medical advice.
          </p>
        </div>
      </div>
    </ConsumerLayout>
  );
}
