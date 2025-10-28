/**
 * EhrConfirmationDialog Component
 * Displays fetched EHR data for user confirmation
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';
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
      <DialogContent className="max-w-md" data-testid="dialog-ehr-confirmation">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasValue ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                We Found Your Information
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                No Data Found
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasValue ? (
            <>
              <p className="text-sm text-muted-foreground">
                From <span className="font-medium">{providerName}</span>
              </p>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{questionText}</p>
                    <p className="text-3xl font-bold" data-testid="text-fetched-value">
                      {formatValue()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-center text-muted-foreground">
                Is it OK to use this information?
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                We couldn't find this information in your health records from {providerName}.
              </p>
              <p className="text-sm font-medium">
                You can enter it manually instead.
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
                No, I'll Enter It
              </Button>
              <Button
                onClick={onConfirm}
                className="flex-1"
                data-testid="button-ehr-confirm"
              >
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
