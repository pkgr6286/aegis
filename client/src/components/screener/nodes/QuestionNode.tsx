import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HelpCircle, List, Hash, Type } from 'lucide-react';
import type { QuestionNodeData } from '@/types/screener';

const questionTypeIcons = {
  yes_no: HelpCircle,
  multiple_choice: List,
  numeric: Hash,
  text: Type,
};

const questionTypeLabels = {
  yes_no: 'Yes/No',
  multiple_choice: 'Multiple Choice',
  numeric: 'Numeric',
  text: 'Text Input',
};

export const QuestionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as QuestionNodeData;
  const Icon = questionTypeIcons[nodeData.questionType];

  return (
    <div
      className={`w-64 rounded-lg border-2 bg-card shadow-md transition-all ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}
      data-testid={`node-question-${nodeData.questionId}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary"
      />
      
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0">
            <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {questionTypeLabels[nodeData.questionType]}
            </div>
            <div className="text-sm font-semibold line-clamp-2">
              {nodeData.questionText}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
          <span className="font-mono">{nodeData.questionId}</span>
          {nodeData.required && (
            <span className="text-red-500 font-medium">Required</span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary"
      />
    </div>
  );
});

QuestionNode.displayName = 'QuestionNode';
