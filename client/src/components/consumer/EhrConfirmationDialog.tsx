/**
 * EhrConfirmationDialog Component
 * Displays AI-processed EHR data for user confirmation with contextual drug information
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Sparkles, Shield, Brain } from 'lucide-react';
import type { QuestionType } from '@/types/consumer';

interface EhrConfirmationDialogProps {
  open: boolean;
  questionText: string;
  questionType: QuestionType;
  fetchedValue: any;
  providerName?: string;
  onConfirm: () => void;
  onReject: () => void;
}

export function EhrConfirmationDialog({
  open,
  questionText,
  questionType,
  fetchedValue,
  providerName = 'your health provider',
  onConfirm,
  onReject,
}: EhrConfirmationDialogProps) {
  // Format the value based on question type
  const formatValue = () => {
    if (fetchedValue === null || fetchedValue === undefined) {
      return 'No data found';
    }

    switch (questionType) {
      case 'boolean':
        return fetchedValue ? 'Yes' : 'No';
      case 'numeric':
        return fetchedValue.toString();
      case 'choice':
        return fetchedValue;
      default:
        return String(fetchedValue);
    }
  };

  const hasValue = fetchedValue !== null && fetchedValue !== undefined;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onReject()}>
      <DialogContent className="max-w-lg" data-testid="dialog-ehr-confirmation">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                {hasValue ? (
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                ) : (
                  <AlertCircle className="h-7 w-7 text-yellow-600" />
                )}
              </div>
              {hasValue && (
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {hasValue ? 'Information Retrieved Successfully' : 'No Data Found'}
          </DialogTitle>
          {hasValue && (
            <DialogDescription className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span>AI-verified from <span className="font-medium text-foreground">{providerName}</span></span>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasValue ? (
            <>
              {/* Success notice */}
              <Alert className="border-primary/20 bg-primary/5">
                <Shield className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs">
                  We've securely extracted this information from your health records. Please verify it's correct.
                </AlertDescription>
              </Alert>

              {/* Data display card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        AI Verified
                      </Badge>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">{questionText}</p>
                      <div className="py-3">
                        <p className="text-4xl font-bold text-primary" data-testid="text-fetched-value">
                          {formatValue()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-center text-muted-foreground">
                Does this look correct?
              </p>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <Alert variant="destructive" className="border-yellow-600/20 bg-yellow-600/5">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  We couldn't find this specific information in your health records from {providerName}.
                </AlertDescription>
              </Alert>
              <p className="text-sm font-medium">
                No worries - you can enter it manually instead.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {hasValue ? (
            <>
              <Button
                variant="outline"
                onClick={onReject}
                className="flex-1"
                data-testid="button-ehr-reject"
              >
                No, I'll Enter It Manually
              </Button>
              <Button
                onClick={onConfirm}
                className="flex-1"
                data-testid="button-ehr-confirm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Yes, Use This
              </Button>
            </>
          ) : (
            <Button
              onClick={onReject}
              className="w-full"
              data-testid="button-ehr-manual-fallback"
            >
              Enter Manually
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
