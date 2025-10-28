import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, List, Hash, Target, Plus } from 'lucide-react';
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
