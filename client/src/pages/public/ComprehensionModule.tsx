import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useSession } from '@/contexts/SessionContext';
import { sessionClient } from '@/lib/sessionClient';
import ComprehensionCheckScreen from '@/pages/public/ComprehensionCheckScreen';
import { ConsumerLayout } from '@/components/consumer/ConsumerLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ScreenerOutcome } from '@/types/screener';

export default function ComprehensionModule() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { screenerConfig, sessionId, sessionToken, setEvaluation } = useSession();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Redirect if no session or no comprehension check
  useEffect(() => {
    if (!sessionId || !sessionToken || !screenerConfig) {
      navigate(`/screen/${slug}`);
    }
  }, [sessionId, sessionToken, screenerConfig, slug, navigate]);

  if (!screenerConfig || !screenerConfig.comprehensionCheck) {
    return (
      <ConsumerLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Comprehension check not configured. Please contact support.</AlertDescription>
        </Alert>
      </ConsumerLayout>
    );
  }

  const handlePass = async () => {
    console.log('[ComprehensionModule] User passed comprehension check');
    toast({
      title: 'Knowledge check passed!',
      description: 'Proceeding to your results...',
    });

    // Navigate to outcome page
    setTimeout(() => {
      navigate(`/screen/${slug}/outcome`);
    }, 1000);
  };

  const handleFail = async (outcome: ScreenerOutcome) => {
    console.log('[ComprehensionModule] User failed comprehension check, outcome:', outcome);
    
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      // Update the session outcome based on comprehension check failure
      const response = await sessionClient.patch<{ success: boolean; data: { evaluation: any } }>(
        `/public/sessions/${sessionId}/outcome`,
        { outcome, reason: 'Comprehension check failed' }
      );

      if (response?.success && response?.data) {
        // Update evaluation in context
        setEvaluation(response.data.evaluation);
        sessionStorage.setItem('pending_evaluation', JSON.stringify(response.data.evaluation));

        toast({
          variant: 'destructive',
          title: 'Knowledge check not passed',
          description: 'Proceeding to your results...',
        });

        // Navigate to outcome page
        setTimeout(() => {
          navigate(`/screen/${slug}/outcome`);
        }, 1500);
      }
    } catch (error) {
      console.error('[ComprehensionModule] Failed to update outcome:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process results. Please contact support.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ComprehensionCheckScreen
      questions={screenerConfig.comprehensionCheck.questions}
      passingScore={screenerConfig.comprehensionCheck.passingScore}
      failOutcome={screenerConfig.comprehensionCheck.failOutcome}
      allowRetry={screenerConfig.comprehensionCheck.allowRetry}
      onPass={handlePass}
      onFail={handleFail}
    />
  );
}
