import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { ComprehensionQuestion, ScreenerOutcome } from '@/types/screener';

interface ComprehensionCheckScreenProps {
  questions: ComprehensionQuestion[];
  passingScore: number;
  failOutcome: ScreenerOutcome;
  allowRetry?: boolean;
  onPass: () => void;
  onFail: (outcome: ScreenerOutcome) => void;
}

export default function ComprehensionCheckScreen({
  questions,
  passingScore,
  failOutcome,
  allowRetry = false,
  onPass,
  onFail,
}: ComprehensionCheckScreenProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const handleSubmit = () => {
    const score = calculateScore();
    setShowResults(true);
    setAttemptCount(attemptCount + 1);

    if (score >= passingScore) {
      // Passed
      setTimeout(() => {
        onPass();
      }, 2000);
    } else {
      // Failed
      if (allowRetry && attemptCount === 0) {
        // Allow retry
        setTimeout(() => {
          setAnswers({});
          setShowResults(false);
        }, 3000);
      } else {
        // No retry or already retried
        setTimeout(() => {
          onFail(failOutcome);
        }, 3000);
      }
    }
  };

  const isAnswerCorrect = (questionId: string): boolean => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return false;
    return answers[questionId] === question.correctAnswer;
  };

  const allAnswered = questions.every((q) => answers[q.id]);
  const score = showResults ? calculateScore() : 0;
  const passed = score >= passingScore;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Knowledge Check</h1>
          <p className="text-muted-foreground">
            Please answer these questions to verify your understanding
          </p>
          <p className="text-sm text-muted-foreground">
            Passing score: {passingScore}% ({Math.ceil((passingScore / 100) * questions.length)} correct out of {questions.length})
            {allowRetry && attemptCount === 0 && ' • You have 1 retry available'}
          </p>
        </div>

        {/* Results Banner */}
        {showResults && (
          <Alert variant={passed ? 'default' : 'destructive'}>
            {passed ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription className="flex items-center justify-between">
              <span>
                {passed
                  ? `Congratulations! You scored ${score}% and passed the knowledge check.`
                  : allowRetry && attemptCount === 1
                  ? `You scored ${score}%. You have one more attempt. Please review and try again.`
                  : `You scored ${score}%. Unfortunately, you did not meet the passing requirement.`}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        {!showResults && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Answered: {Object.keys(answers).length} of {questions.length}</span>
              <span>{Math.round((Object.keys(answers).length / questions.length) * 100)}% Complete</span>
            </div>
            <Progress 
              value={(Object.keys(answers).length / questions.length) * 100} 
              className="h-2" 
              data-testid="progress-quiz"
            />
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card 
              key={question.id}
              className={showResults ? (isAnswerCorrect(question.id) ? 'border-green-500' : 'border-destructive') : ''}
            >
              <CardHeader>
                <CardTitle className="text-base flex items-start gap-2">
                  <span className="text-muted-foreground">Q{index + 1}.</span>
                  <span className="flex-1">{question.text}</span>
                  {showResults && (
                    isAnswerCorrect(question.id) ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )
                  )}
                </CardTitle>
                {showResults && !isAnswerCorrect(question.id) && (
                  <CardDescription className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Correct answer: {question.correctAnswer}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
                  disabled={showResults}
                  data-testid={`radiogroup-question-${question.id}`}
                >
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option} 
                        id={`${question.id}-${option}`}
                        data-testid={`radio-${question.id}-${option}`}
                      />
                      <Label 
                        htmlFor={`${question.id}-${option}`}
                        className={showResults && option === question.correctAnswer ? 'font-semibold text-green-600' : ''}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        {!showResults && (
          <Card>
            <CardFooter className="pt-6">
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="w-full"
                data-testid="button-submit-quiz"
              >
                Submit Answers
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Helper Text */}
        {!showResults && (
          <div className="text-center text-sm text-muted-foreground">
            Please answer all questions before submitting
          </div>
        )}
      </div>
    </div>
  );
}
