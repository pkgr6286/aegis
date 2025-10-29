import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, List, Hash, Target, Plus, Link2, Sparkles } from 'lucide-react';
import type { QuestionType } from '@/types/screener';

interface NodePaletteProps {
  onAddNode: (type: 'question' | 'outcome', questionType?: QuestionType) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold mb-2">Node Palette</h2>
        <p className="text-xs text-muted-foreground">
          Click to add nodes to your screening flow
        </p>
      </div>

      {/* EHR Integration Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-blue-600 dark:bg-blue-500">
              <Link2 className="w-3.5 h-3.5 text-white" />
            </div>
            <CardTitle className="text-sm flex items-center gap-1.5">
              Connect EHR
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </CardTitle>
          </div>
          <CardDescription className="text-xs leading-relaxed">
            Enable questions to auto-fill from patient health records (EHR)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs space-y-2">
            <p className="text-muted-foreground">
              <strong className="text-foreground">How it works:</strong>
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground ml-3">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                <span>Add a question to your flow</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                <span>Toggle on EHR Integration</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                <span>Enter FHIR path (e.g., Condition.diabetes)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
                <span>Patients can connect their portal to auto-fill</span>
              </li>
            </ul>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              💡 Questions with EHR integration show a "Connect My Patient Portal" option
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Question Types</CardTitle>
          <CardDescription className="text-xs">
            Add screening questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => onAddNode('question', 'boolean')}
            data-testid="button-add-boolean"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="flex-1 text-left">Yes/No (Boolean)</span>
            <Plus className="w-3 h-3 opacity-50" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => onAddNode('question', 'choice')}
            data-testid="button-add-choice"
          >
            <List className="w-4 h-4" />
            <span className="flex-1 text-left">Multiple Choice</span>
            <Plus className="w-3 h-3 opacity-50" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => onAddNode('question', 'numeric')}
            data-testid="button-add-numeric"
          >
            <Hash className="w-4 h-4" />
            <span className="flex-1 text-left">Numeric</span>
            <Plus className="w-3 h-3 opacity-50" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Outcomes</CardTitle>
          <CardDescription className="text-xs">
            Add screening results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => onAddNode('outcome')}
            data-testid="button-add-outcome"
          >
            <Target className="w-4 h-4" />
            <span className="flex-1 text-left">Outcome</span>
            <Plus className="w-3 h-3 opacity-50" />
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-xs text-muted-foreground space-y-2">
        <p className="font-semibold">Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Connect nodes by dragging from handles</li>
          <li>Click nodes to edit properties</li>
          <li>Use Start node as entry point</li>
          <li>End flows with Outcome nodes</li>
        </ul>
      </div>
    </div>
  );
}
