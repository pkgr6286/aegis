/**
 * NumericQuestion Component - Numeric input type
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumericQuestionProps {
  value: number | string;
  onChange: (value: number | string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  unit?: string;
  disabled?: boolean;
}

export function NumericQuestion({ 
  value, 
  onChange, 
  min, 
  max, 
  placeholder = "Enter a number",
  unit,
  disabled = false 
}: NumericQuestionProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          placeholder={placeholder}
          disabled={disabled}
          className="h-14 text-lg text-center pr-16"
          data-testid="input-numeric-answer"
        />
        {unit && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            {unit}
          </div>
        )}
      </div>
      
      {(min !== undefined || max !== undefined) && (
        <div className="text-sm text-muted-foreground text-center">
          {min !== undefined && max !== undefined && (
            <span>Valid range: {min} - {max}</span>
          )}
          {min !== undefined && max === undefined && (
            <span>Minimum: {min}</span>
          )}
          {min === undefined && max !== undefined && (
            <span>Maximum: {max}</span>
          )}
        </div>
      )}
    </div>
  );
}
