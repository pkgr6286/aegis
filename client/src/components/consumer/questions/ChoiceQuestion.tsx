/**
 * ChoiceQuestion Component - Multiple choice question type
 */

import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ChoiceQuestionProps {
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ChoiceQuestion({ options, value, onChange, disabled = false }: ChoiceQuestionProps) {
  return (
    <RadioGroup
      value={value || ''}
      onValueChange={onChange}
      disabled={disabled}
      className="w-full max-w-md mx-auto space-y-3"
    >
      {options.map((option, index) => (
        <div
          key={index}
          className={`
            flex items-center space-x-3 border rounded-lg p-4 cursor-pointer
            transition-colors
            ${value === option ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !disabled && onChange(option)}
          data-testid={`choice-option-${index}`}
        >
          <RadioGroupItem 
            value={option} 
            id={`option-${index}`}
            className="min-w-[20px]"
          />
          <Label
            htmlFor={`option-${index}`}
            className="flex-1 text-base cursor-pointer font-normal"
          >
            {option}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
