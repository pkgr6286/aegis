/**
 * Outcome Screen - Displays screening result
 * Shows OK to Use, Ask a Doctor, or Do Not Use outcome
 */

import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useSession } from '@/contexts/SessionContext';
import { ConsumerLayout } from '@/components/consumer/ConsumerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, XCircle, ArrowRight } from 'lucide-react';

export default function Outcome() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { evaluation: contextEvaluation, session, program, setEvaluation } = useSession();

  // Get evaluation from sessionStorage (bridge from screener) or context
  // sessionStorage takes precedence to avoid React state race condition
  let evaluation = contextEvaluation;
  
  if (!evaluation) {
    const pendingEval = sessionStorage.getItem('pending_evaluation');
    if (pendingEval) {
      try {
        const parsedEval = JSON.parse(pendingEval);
        evaluation = parsedEval;
        // Set in context for future renders
        if (parsedEval) {
          setEvaluation(parsedEval);
        }
        // Clear from sessionStorage
        sessionStorage.removeItem('pending_evaluation');
        console.log('[Outcome] Loaded evaluation from sessionStorage:', evaluation);
      } catch (e) {
        console.error('[Outcome] Failed to parse pending evaluation:', e);
      }
    }
  }

  console.log('[Outcome] Rendering - context:', contextEvaluation, 'final:', evaluation);

  // Redirect if no evaluation
  useEffect(() => {
    if (!evaluation) {
      console.log('[Outcome] No evaluation found, redirecting to welcome');
      navigate(`/screen/${slug}`);
    } else {
      console.log('[Outcome] Evaluation found:', evaluation.outcome);
    }
  }, [evaluation, slug, navigate]);

  if (!evaluation) {
    console.log('[Outcome] Returning null (no evaluation)');
    return null;
  }

  const getOutcomeConfig = () => {
    switch (evaluation.outcome) {
      case 'ok_to_use':
        return {
          icon: CheckCircle2,
          iconClassName: 'text-green-600 dark:text-green-400',
          bgClassName: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
          title: `You're cleared to use ${program?.name || 'this product'}`,
          description: 'Based on your answers, this product appears suitable for you.',
          actionLabel: 'Get My Verification Code',
          actionPath: `/screen/${slug}/code`,
        };
      case 'ask_a_doctor':
        return {
          icon: AlertCircle,
          iconClassName: 'text-amber-600 dark:text-amber-400',
          bgClassName: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
          title: 'Please consult a healthcare professional',
          description: 'Based on your answers, we recommend speaking with a doctor or pharmacist before using this product.',
          actionLabel: 'Done',
          actionPath: `/screen/${slug}`,
        };
      case 'do_not_use':
        return {
          icon: XCircle,
          iconClassName: 'text-red-600 dark:text-red-400',
          bgClassName: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
          title: 'This product may not be suitable for you',
          description: 'Based on your answers, we do not recommend using this product. Please consult with a healthcare professional.',
          actionLabel: 'Done',
          actionPath: `/screen/${slug}`,
        };
      default:
        return {
          icon: AlertCircle,
          iconClassName: 'text-muted-foreground',
          bgClassName: 'bg-muted',
          title: 'Screening Complete',
          description: 'Thank you for completing the screening.',
          actionLabel: 'Done',
          actionPath: `/screen/${slug}`,
        };
    }
  };

  const config = getOutcomeConfig();
  const OutcomeIcon = config.icon;

  const handleAction = () => {
    navigate(config.actionPath);
  };

  return (
    <ConsumerLayout>
      <div className="space-y-6 max-w-2xl mx-auto" data-testid="outcome-screen">
        {/* Outcome Card */}
        <Card className={`border-2 ${config.bgClassName}`}>
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-background shadow-lg">
                <OutcomeIcon className={`w-12 h-12 ${config.iconClassName}`} data-testid="outcome-icon" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold" data-testid="outcome-title">
                {config.title}
              </CardTitle>
              <CardDescription className="text-base text-foreground/80">
                {config.description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Reason and Recommendations */}
            {evaluation.reason && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Why:</strong> {evaluation.reason}
                </AlertDescription>
              </Alert>
            )}

            {evaluation.recommendedActions && evaluation.recommendedActions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                  Recommended Next Steps
                </h3>
                <ul className="space-y-2">
                  {evaluation.recommendedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Button */}
            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold"
              onClick={handleAction}
              data-testid="button-outcome-action"
            >
              {config.actionLabel}
            </Button>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              This screening is not a substitute for professional medical advice. Always consult with a healthcare provider for medical concerns.
            </p>
          </CardContent>
        </Card>
      </div>
    </ConsumerLayout>
  );
}
