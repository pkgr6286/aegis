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
import { DiagnosticTestQuestion } from '@/components/consumer/questions/DiagnosticTestQuestion';
import { InfoTooltip } from '@/components/consumer/questions/InfoTooltip';
import { EhrChoiceCard } from '@/components/consumer/EhrChoiceCard';
import { EhrConfirmationDialog } from '@/components/consumer/EhrConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { openEhrOAuthPopup, fetchEhrData, extractEhrValue } from '@/lib/ehrUtils';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  // EHR Fast Path state
  const [showEhrChoice, setShowEhrChoice] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showEhrConfirmation, setShowEhrConfirmation] = useState(false);
  const [ehrFetchedValue, setEhrFetchedValue] = useState<any>(null);
  const [ehrProviderName, setEhrProviderName] = useState<string>('your health provider');

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
        
        // Check if this question has EHR mapping
        if (currentQuestion.ehrMapping && !answer) {
          // Show EHR choice screen for questions with EHR mapping and no existing answer
          setShowEhrChoice(true);
          setShowManualEntry(false);
        } else {
          // Show standard question for questions without EHR or with existing answer
          setShowEhrChoice(false);
          setShowManualEntry(true);
        }
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
      // Reset EHR state
      setShowEhrConfirmation(false);
      setEhrFetchedValue(null);
    }
  };

  // EHR Fast Path Handlers
  const handleConnectEhr = async () => {
    if (!sessionId || !sessionToken) {
      toast({
        variant: 'destructive',
        title: 'Session error',
        description: 'Please restart the screening process.',
      });
      return;
    }

    try {
      // Open OAuth popup and get data
      const result = await openEhrOAuthPopup(sessionId, sessionToken);
      
      if (!result.success || !result.data) {
        // User closed popup or OAuth failed
        toast({
          title: 'Connection cancelled',
          description: 'You can enter the information manually instead.',
        });
        setShowEhrChoice(false);
        setShowManualEntry(true);
        return;
      }

      // Data returned directly from popup (AI processed)
      const ehrData = result.data;

      // Store full EHR data globally for later use
      (window as any).__ehrData = ehrData;

      // Extract value for current question from EHR mapping
      if (currentQuestion.ehrMapping) {
        const fhirPath = currentQuestion.ehrMapping.fhirPath;
        
        // Map FHIR paths to extracted data fields
        let value = null;
        if (fhirPath === 'Condition.asthma_copd') {
          value = ehrData.asthma_copd_diagnosis === true ? 'yes' : 'no';
        } else if (fhirPath === 'Observation.ldl') {
          value = ehrData.ldl_cholesterol || null;
        } else if (fhirPath === 'Condition.diabetes') {
          value = ehrData.diabetes_diagnosis === true ? 'yes' : 'no';
        } else {
          // Fallback to generic extraction
          value = extractEhrValue(ehrData, fhirPath);
        }
        
        setEhrFetchedValue(value);
        setEhrProviderName(ehrData.provider || 'MyHealthPortal');
        setShowEhrConfirmation(true);
      }
    } catch (error) {
      console.error('EHR connection error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection failed',
        description: 'Unable to connect to health records. Please enter manually.',
      });
      setShowEhrChoice(false);
      setShowManualEntry(true);
    }
  };

  const handleManualEntry = () => {
    setShowEhrChoice(false);
    setShowManualEntry(true);
  };

  const handleEhrConfirm = async () => {
    if (!screenerEngine || !screenerConfig) return;

    // User confirmed the EHR data - try to auto-fill ALL questions from EHR
    const ehrAnswers: Record<string, any> = { ...screenerState.answers };
    
    // Extract the full EHR data that was returned from the popup
    // We stored it temporarily when fetching
    const fullEhrData = (window as any).__ehrData || {};
    
    // Map ALL questions with EHR mappings to their answers
    screenerConfig.questions.forEach((question) => {
      if (question.ehrMapping) {
        const fhirPath = question.ehrMapping.fhirPath;
        let value = null;
        
        // Map FHIR paths to extracted data fields
        if (fhirPath === 'Condition.asthma_copd') {
          value = fullEhrData.asthma_copd_diagnosis === true ? 'yes' : 'no';
        } else if (fhirPath === 'Observation.ldl') {
          value = fullEhrData.ldl_cholesterol || null;
        } else if (fhirPath === 'Condition.diabetes') {
          value = fullEhrData.diabetes_diagnosis === true ? 'yes' : 'no';
        } else {
          value = extractEhrValue(fullEhrData, fhirPath);
        }
        
        if (value !== null && value !== undefined) {
          ehrAnswers[question.id] = value;
        }
      }
    });

    // Auto-fill common questions from EHR data using AI-inferred values
    // Age verification (common across all programs)
    if (fullEhrData.age_verified === true) {
      ehrAnswers['age_check'] = 'yes';
    }

    // Advair-specific questions
    if (fullEhrData.rescue_inhaler_usage) {
      ehrAnswers['rescue_inhaler_freq'] = fullEhrData.rescue_inhaler_usage;
    }
    if (fullEhrData.no_acute_attack === true) {
      ehrAnswers['acute_attack'] = 'no';
    }
    if (fullEhrData.no_heart_conditions === true) {
      ehrAnswers['heart_conditions'] = 'no';
    }

    // Cholesterol program questions
    if (fullEhrData.no_pregnancy === true) {
      ehrAnswers['pregnancy_check'] = 'no';
    }
    if (fullEhrData.no_liver_disease === true) {
      ehrAnswers['liver_disease'] = 'no';
    }
    if (fullEhrData.no_current_statin === true) {
      ehrAnswers['current_statin'] = 'no';
    }

    // Diabetes program questions (Januvia)
    if (fullEhrData.no_kidney_disease === true) {
      ehrAnswers['kidney_check'] = 'No kidney disease'; // Choice question - must match exact option text
    }
    if (fullEhrData.no_pancreatitis === true) {
      ehrAnswers['pancreatitis_check'] = 'no';
    }
    if (fullEhrData.no_current_diabetes_meds === true) {
      ehrAnswers['current_diabetes_meds'] = 'no';
    }

    // Check if we can complete the screening with EHR data alone
    const allQuestionsAnswered = screenerConfig.questions.every(
      (question) => !question.required || ehrAnswers[question.id] !== undefined
    );

    if (allQuestionsAnswered) {
      // We have enough data! Submit directly
      setShowEhrConfirmation(false);
      
      toast({
        title: '✨ Processing your information',
        description: "We have everything we need from your health records!",
      });

      // Submit the EHR-filled answers
      await handleSubmit(ehrAnswers);
    } else {
      // Not enough data - continue with regular flow but pre-fill what we have
      setCurrentAnswer(ehrFetchedValue);
      updateAnswer(currentQuestion.id, ehrFetchedValue);
      setShowEhrConfirmation(false);
      setShowEhrChoice(false);
      setShowManualEntry(true);
      
      toast({
        title: 'Information saved',
        description: "We'll ask a few more questions to complete your screening.",
      });
    }
  };

  const handleEhrReject = () => {
    // User rejected the EHR data - show manual entry
    setShowEhrConfirmation(false);
    setShowEhrChoice(false);
    setShowManualEntry(true);
    setEhrFetchedValue(null);
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

      console.log('[Screener] Checking for education module and comprehension check');
      
      // Check for required education module
      if (screenerConfig.educationModule?.required) {
        console.log('[Screener] Education module required, navigating to education screen');
        navigate(`/screen/${slug}/education`);
        return;
      }

      // Check for required comprehension check (if no education module)
      if (screenerConfig.comprehensionCheck?.required) {
        console.log('[Screener] Comprehension check required, navigating to comprehension screen');
        navigate(`/screen/${slug}/comprehension`);
        return;
      }

      console.log('[Screener] No education or comprehension required, navigating to outcome page');
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

      case 'diagnostic_test':
        return (
          <DiagnosticTestQuestion
            value={currentAnswer}
            onChange={handleAnswerChange}
            testType={currentQuestion.testType}
            disabled={isSubmitting}
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <ConsumerLayout showProgress progress={progress}>
      {/* EHR Choice Card - "The Fork" */}
      {showEhrChoice && (
        <EhrChoiceCard
          questionText={currentQuestion.text}
          onConnectEhr={handleConnectEhr}
          onManualEntry={handleManualEntry}
        />
      )}

      {/* Standard Question Card */}
      {showManualEntry && (
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
      )}

      {/* EHR Confirmation Dialog */}
      <EhrConfirmationDialog
        open={showEhrConfirmation}
        questionText={currentQuestion.text}
        questionType={currentQuestion.type}
        fetchedValue={ehrFetchedValue}
        providerName={ehrProviderName}
        onConfirm={handleEhrConfirm}
        onReject={handleEhrReject}
      />
    </ConsumerLayout>
  );
}
