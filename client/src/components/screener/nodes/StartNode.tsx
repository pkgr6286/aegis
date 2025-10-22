import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';

export const StartNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`px-6 py-4 rounded-lg border-2 bg-card shadow-md transition-all ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}
      data-testid="node-start"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
          <Play className="w-5 h-5 text-green-600 dark:text-green-400 fill-current" />
        </div>
        <div>
          <div className="font-semibold text-sm">Start</div>
          <div className="text-xs text-muted-foreground">Screening begins here</div>
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

StartNode.displayName = 'StartNode';
