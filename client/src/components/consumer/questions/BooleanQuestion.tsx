/**
 * BooleanQuestion Component - Yes/No question type
 */

import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface BooleanQuestionProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function BooleanQuestion({ value, onChange, disabled = false }: BooleanQuestionProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-md mx-auto">
      <Button
        type="button"
        variant={value === true ? "default" : "outline"}
        size="lg"
        className="h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-lg font-semibold"
        onClick={() => onChange(true)}
        disabled={disabled}
        data-testid="button-answer-yes"
      >
        <CheckCircle2 className="h-8 w-8" />
        Yes
      </Button>

      <Button
        type="button"
        variant={value === false ? "default" : "outline"}
        size="lg"
        className="h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-lg font-semibold"
        onClick={() => onChange(false)}
        disabled={disabled}
        data-testid="button-answer-no"
      >
        <XCircle className="h-8 w-8" />
        No
      </Button>
    </div>
  );
}
