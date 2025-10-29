import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, FileText, Calendar, Beaker, Upload } from 'lucide-react';
import type { DiagnosticTestAnswer } from '@/lib/schemas';

interface DiagnosticTestQuestionProps {
  value: DiagnosticTestAnswer | null;
  onChange: (value: DiagnosticTestAnswer) => void;
  testType?: string;
  disabled?: boolean;
}

export function DiagnosticTestQuestion({ 
  value, 
  onChange, 
  testType = 'diagnostic test',
  disabled = false 
}: DiagnosticTestQuestionProps) {
  const [showDetails, setShowDetails] = useState(value?.hasTest || false);

  const handleHasTestChange = (hasTest: boolean) => {
    setShowDetails(hasTest);
    if (hasTest) {
      onChange({
        hasTest: true,
        testName: value?.testName || '',
        testDate: value?.testDate || '',
        result: value?.result || '',
        uploadUrl: value?.uploadUrl || '',
      });
    } else {
      onChange({
        hasTest: false,
      });
    }
  };

  const handleFieldChange = (field: keyof DiagnosticTestAnswer, fieldValue: string) => {
    onChange({
      ...value,
      hasTest: true,
      [field]: fieldValue,
    } as DiagnosticTestAnswer);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Initial Question: Do you have test results? */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Button
          type="button"
          variant={value?.hasTest === true ? "default" : "outline"}
          size="lg"
          className="h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-lg font-semibold"
          onClick={() => handleHasTestChange(true)}
          disabled={disabled}
          data-testid="button-has-test-yes"
        >
          <CheckCircle2 className="h-8 w-8" />
          Yes, I have test results
        </Button>

        <Button
          type="button"
          variant={value?.hasTest === false ? "default" : "outline"}
          size="lg"
          className="h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-lg font-semibold"
          onClick={() => handleHasTestChange(false)}
          disabled={disabled}
          data-testid="button-has-test-no"
        >
          <XCircle className="h-8 w-8" />
          No, I don't have results
        </Button>
      </div>

      {/* Details Form (shown when user has test results) */}
      {showDetails && value?.hasTest && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Beaker className="w-5 h-5 text-primary" />
              Test Details
            </CardTitle>
            <CardDescription className="text-sm">
              Please provide information about your {testType}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test Name */}
            <div className="space-y-2">
              <Label htmlFor="test-name" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Test Name
              </Label>
              <Input
                id="test-name"
                type="text"
                placeholder={`e.g., ${testType}`}
                value={value.testName || ''}
                onChange={(e) => handleFieldChange('testName', e.target.value)}
                disabled={disabled}
                data-testid="input-test-name"
              />
            </div>

            {/* Test Date */}
            <div className="space-y-2">
              <Label htmlFor="test-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Test
              </Label>
              <Input
                id="test-date"
                type="date"
                value={value.testDate || ''}
                onChange={(e) => handleFieldChange('testDate', e.target.value)}
                disabled={disabled}
                data-testid="input-test-date"
              />
            </div>

            {/* Test Result */}
            <div className="space-y-2">
              <Label htmlFor="test-result" className="flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                Test Result / Value
              </Label>
              <Input
                id="test-result"
                type="text"
                placeholder="e.g., Negative, or numeric value"
                value={value.result || ''}
                onChange={(e) => handleFieldChange('result', e.target.value)}
                disabled={disabled}
                data-testid="input-test-result"
              />
            </div>

            {/* Document Upload (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="test-upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Document (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="test-upload"
                  type="url"
                  placeholder="Paste document URL or upload link"
                  value={value.uploadUrl || ''}
                  onChange={(e) => handleFieldChange('uploadUrl', e.target.value)}
                  disabled={disabled}
                  className="flex-1"
                  data-testid="input-test-upload"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You can upload your test results to a secure service and paste the link here
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info message when user doesn't have test results */}
      {value?.hasTest === false && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> This medication may require {testType} results for approval. 
              You may need to consult with your healthcare provider to obtain the necessary diagnostic test.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
