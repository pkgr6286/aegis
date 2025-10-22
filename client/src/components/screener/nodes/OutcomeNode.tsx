import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { OutcomeNodeData } from '@/types/screener';

const outcomeConfig = {
  ok_to_use: {
    icon: CheckCircle,
    label: 'OK to Use',
    bgClass: 'bg-green-100 dark:bg-green-900',
    iconClass: 'text-green-600 dark:text-green-400',
    borderClass: 'border-green-500',
  },
  ask_a_doctor: {
    icon: AlertTriangle,
    label: 'Ask a Doctor',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
    borderClass: 'border-yellow-500',
  },
  do_not_use: {
    icon: XCircle,
    label: 'Do Not Use',
    bgClass: 'bg-red-100 dark:bg-red-900',
    iconClass: 'text-red-600 dark:text-red-400',
    borderClass: 'border-red-500',
  },
};

export const OutcomeNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as OutcomeNodeData;
  const config = outcomeConfig[nodeData.outcome];
  const Icon = config.icon;

  return (
    <div
      className={`w-56 rounded-lg border-2 bg-card shadow-md transition-all ${
        selected ? 'border-primary ring-2 ring-primary/20' : config.borderClass
      }`}
      data-testid={`node-outcome-${nodeData.outcome}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary"
      />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-full ${config.bgClass}`}>
            <Icon className={`w-5 h-5 ${config.iconClass}`} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold">{config.label}</div>
          </div>
        </div>

        {nodeData.message && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground line-clamp-3">
            {nodeData.message}
          </div>
        )}
      </div>
    </div>
  );
});

OutcomeNode.displayName = 'OutcomeNode';
