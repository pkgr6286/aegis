import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface SessionDetail {
  id: string;
  drugProgramName: string;
  drugProgramSlug: string;
  screenerVersion: number;
  screenerJson: {
    questions: Array<{
      id: string;
      text: string;
      type: string;
      helpText?: string;
      options?: string[];
    }>;
  };
  status: string;
  outcome: 'ok_to_use' | 'ask_a_doctor' | 'do_not_use';
  answersJson: Record<string, any>;
  reviewStatus: 'pending' | 'reviewed' | 'follow_up_required';
  reviewedByEmail: string | null;
  reviewedAt: string | null;
  createdAt: string;
  completedAt: string;
}

const reviewSchema = z.object({
  reviewStatus: z.enum(['reviewed', 'follow_up_required']),
  clinicalNotes: z.string().max(5000).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function SessionReview() {
  const [match, params] = useRoute('/clinician/sessions/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const sessionId = params?.id;

  // Fetch session details
  const { data: sessionData, isLoading } = useQuery<{success: boolean; data: SessionDetail}>({
    queryKey: [`/api/v1/clinician/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  const session = sessionData?.data;

  // Form setup
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewStatus: 'reviewed',
      clinicalNotes: '',
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest('POST', `/api/v1/clinician/sessions/${sessionId}/review`, data);
      return response.json();
    },
    onSuccess: (response: { success: boolean; data: any; message?: string }) => {
      toast({
        title: 'Review Submitted',
        description: response.message || 'Clinical review has been saved successfully',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/v1/clinician/sessions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/v1/clinician/sessions/${sessionId}`] });
      
      // Navigate back to review queue
      setLocation('/clinician/review-queue');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    submitReviewMutation.mutate(data);
  };

  const getOutcomeBadgeVariant = (outcome: string) => {
    switch (outcome) {
      case 'ok_to_use':
        return 'default';
      case 'ask_a_doctor':
        return 'secondary';
      case 'do_not_use':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatOutcome = (outcome: string) => {
    return outcome.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
          Loading session details...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-8 text-muted-foreground" data-testid="text-not-found">
          Session not found
        </div>
      </div>
    );
  }

  const isAlreadyReviewed = session.reviewStatus === 'reviewed' || session.reviewStatus === 'follow_up_required';

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => setLocation('/clinician/review-queue')}
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Queue
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Session Review
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Review consumer screening responses and provide clinical guidance
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Session Context and Q&A */}
        <div className="space-y-6 lg:col-span-2">
          {/* Session Context */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-context-title">Session Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Session ID</div>
                  <div className="font-mono text-sm" data-testid="text-session-id">{session.id.slice(0, 8)}...</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Drug Program</div>
                  <div data-testid="text-program-name">{session.drugProgramName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Outcome</div>
                  <Badge variant={getOutcomeBadgeVariant(session.outcome)} data-testid="badge-outcome">
                    {formatOutcome(session.outcome)}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Completed</div>
                  <div data-testid="text-completed">
                    {formatDistanceToNow(new Date(session.completedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Q&A Section */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-qa-title">Consumer Responses</CardTitle>
              <CardDescription data-testid="text-qa-description">
                Review the patient's answers to the screening questionnaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {session.screenerJson.questions.map((question, index) => {
                  const answer = session.answersJson[question.id];
                  
                  return (
                    <div key={question.id} className="space-y-2" data-testid={`qa-item-${question.id}`}>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium" data-testid={`text-question-${question.id}`}>
                            {question.text}
                          </p>
                          {question.helpText && (
                            <p className="text-sm text-muted-foreground">{question.helpText}</p>
                          )}
                          <p className="text-base font-semibold" data-testid={`text-answer-${question.id}`}>
                            {answer !== undefined && answer !== null ? String(answer) : 'No answer provided'}
                          </p>
                        </div>
                      </div>
                      {index < session.screenerJson.questions.length - 1 && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Review Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-review-form-title">Clinical Review</CardTitle>
              <CardDescription data-testid="text-review-form-description">
                {isAlreadyReviewed 
                  ? 'This session has already been reviewed'
                  : 'Submit your clinical assessment'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAlreadyReviewed ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Reviewed by {session.reviewedByEmail}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.reviewedAt && formatDistanceToNow(new Date(session.reviewedAt), { addSuffix: true })}
                  </div>
                  <div className="text-sm">
                    Status: <Badge variant="default">{session.reviewStatus.replace('_', ' ')}</Badge>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="reviewStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-review-status">Review Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-review-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="reviewed">Reviewed - No Follow-up</SelectItem>
                              <SelectItem value="follow_up_required">Reviewed - Follow-up Required</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clinicalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-clinical-notes">Clinical Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any relevant clinical observations or recommendations..."
                              className="min-h-[150px]"
                              data-testid="textarea-clinical-notes"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        This review will be recorded in the audit log and cannot be undone.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitReviewMutation.isPending}
                      data-testid="button-submit-review"
                    >
                      {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
