/**
 * Screener Screen - Dynamic question rendering with branching logic
 * Core of the consumer screening experience
 */

import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useSession } from '@/contexts/SessionContext';
import { sessionClient } from '@/lib/sessionClient';
import { ScreenerEngine } from '@/lib/screenerEngine';
import { ConsumerLayout } from '@/components/consumer/ConsumerLayout';
import { BooleanQuestion } from '@/components/consumer/questions/BooleanQuestion';
import { NumericQuestion } from '@/components/consumer/questions/NumericQuestion';
import { ChoiceQuestion } from '@/components/consumer/questions/ChoiceQuestion';
import { InfoTooltip } from '@/components/consumer/questions/InfoTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import type { SubmitAnswersResponse } from '@/types/consumer';

export default function Screener() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const {
    session,
    sessionId,
    sessionToken,
    screenerConfig,
    screenerState,
    updateAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    setScreenerComplete,
    setEvaluation,
  } = useSession();

  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenerEngine, setScreenerEngine] = useState<ScreenerEngine | null>(null);

  // Initialize screener engine once when screenerConfig is available
  useEffect(() => {
    if (screenerConfig) {
      const engine = new ScreenerEngine(screenerConfig, screenerState.answers);
      setScreenerEngine(engine);
    }
  }, [screenerConfig]); // Only recreate when config changes, not answers

  // Update answers in the existing engine when they change
  useEffect(() => {
    if (screenerEngine) {
      screenerEngine.updateAnswers(screenerState.answers);
    }
  }, [screenerEngine, screenerState.answers]);

  // Redirect if no session
  useEffect(() => {
    if (!sessionId || !sessionToken || !screenerConfig) {
      navigate(`/screen/${slug}`);
    }
  }, [sessionId, sessionToken, screenerConfig, slug, navigate]);

  // Load current answer when question changes
  useEffect(() => {
    if (screenerEngine) {
      const currentQuestion = screenerEngine.getCurrentQuestion(screenerState.currentQuestionIndex);
      if (currentQuestion) {
        const answer = screenerState.answers[currentQuestion.id];
        setCurrentAnswer(answer !== undefined ? answer : null);
      }
    }
  }, [screenerEngine, screenerState.currentQuestionIndex, screenerState.answers]);

  if (!screenerEngine || !screenerConfig) {
    return (
      <ConsumerLayout showProgress progress={0}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Screening not initialized. Please start from the beginning.</AlertDescription>
        </Alert>
      </ConsumerLayout>
    );
  }

  const currentQuestion = screenerEngine.getCurrentQuestion(screenerState.currentQuestionIndex);

  if (!currentQuestion) {
    // All questions complete - this shouldn't happen as we navigate away
    return null;
  }

  const progress = screenerEngine.calculateProgress(screenerState.currentQuestionIndex);
  const canGoBack = screenerState.currentQuestionIndex > 0;
  const isLastQuestion = screenerEngine.getNextQuestionIndex(screenerState.currentQuestionIndex) === null;

  const handleAnswerChange = (value: any) => {
    setCurrentAnswer(value);
    setError(null);
  };

  const handleNext = async () => {
    if (currentAnswer === null || currentAnswer === undefined || currentAnswer === '') {
      setError('Please provide an answer before continuing');
      return;
    }

    // Validate answer
    const validation = screenerEngine.validateAnswer(currentQuestion.id, currentAnswer);
    if (!validation.valid) {
      setError(validation.error || 'Invalid answer');
      return;
    }

    // Save answer
    updateAnswer(currentQuestion.id, currentAnswer);

    // Update screener engine with new answer
    const updatedAnswers = { ...screenerState.answers, [currentQuestion.id]: currentAnswer };
    screenerEngine.updateAnswers(updatedAnswers);

    // Check if this was the last question
    if (isLastQuestion) {
      // Submit answers to backend
      await handleSubmit(updatedAnswers);
    } else {
      // Move to next question
      const nextIndex = screenerEngine.getNextQuestionIndex(screenerState.currentQuestionIndex);
      if (nextIndex !== null) {
        goToNextQuestion();
        setCurrentAnswer(null);
        setError(null);
      }
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      goToPreviousQuestion();
      setError(null);
    }
  };

  const handleSubmit = async (finalAnswers: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await sessionClient.put<SubmitAnswersResponse>(
        `/public/sessions/${sessionId}`,
        { answers: finalAnswers }
      );

      console.log('[Screener] Submit response:', response);

      if (!response.success || !response.data) {
        console.error('[Screener] Invalid response:', response);
        throw new Error('Failed to submit answers');
      }

      console.log('[Screener] Evaluation:', response.data.evaluation);

      // Mark screener complete and set evaluation in context
      setScreenerComplete();
      setEvaluation(response.data.evaluation);

      // Store evaluation in sessionStorage as a bridge to avoid React state race condition
      // This ensures Outcome component can access it immediately
      sessionStorage.setItem('pending_evaluation', JSON.stringify(response.data.evaluation));

      console.log('[Screener] Navigating to outcome page');
      // Navigate to outcome page
      navigate(`/screen/${slug}/outcome`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answers');
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'boolean':
        return (
          <BooleanQuestion
            value={currentAnswer}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />
        );

      case 'numeric':
        return (
          <NumericQuestion
            value={currentAnswer || ''}
            onChange={handleAnswerChange}
            min={currentQuestion.min}
            max={currentQuestion.max}
            disabled={isSubmitting}
          />
        );

      case 'choice':
        return (
          <ChoiceQuestion
            options={currentQuestion.options || []}
            value={currentAnswer}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <ConsumerLayout showProgress progress={progress}>
      <Card className="border-2" data-testid="screener-question-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-2xl sm:text-3xl font-semibold leading-tight flex-1">
              {currentQuestion.text}
              {currentQuestion.helpText && (
                <InfoTooltip content={currentQuestion.helpText} />
              )}
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Question {screenerState.currentQuestionIndex + 1} of {screenerEngine.getTotalQuestions()}
          </p>
        </CardHeader>

        <CardContent className="py-8">
          {renderQuestion()}

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="lg"
            onClick={handleBack}
            disabled={!canGoBack || isSubmitting}
            className="flex-1 sm:flex-initial"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            size="lg"
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial min-w-[140px]"
            data-testid="button-next"
          >
            {isSubmitting ? 'Submitting...' : isLastQuestion ? 'Submit' : 'Next'}
            {!isSubmitting && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </CardFooter>
      </Card>
    </ConsumerLayout>
  );
}
