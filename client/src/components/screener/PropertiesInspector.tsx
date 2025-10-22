import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, X } from 'lucide-react';
import type { ScreenerNode, QuestionNodeData, OutcomeNodeData } from '@/types/screener';

interface PropertiesInspectorProps {
  selectedNode: ScreenerNode | undefined;
  onUpdateNode: (nodeId: string, updates: Record<string, unknown>) => void;
  onDeleteNode: (nodeId: string) => void;
}

export function PropertiesInspector({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
}: PropertiesInspectorProps) {
  if (!selectedNode) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm font-medium">No node selected</p>
          <p className="text-xs mt-1">Click on a node to edit its properties</p>
        </div>
      </div>
    );
  }

  if (selectedNode.type === 'start') {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Start Node</CardTitle>
            <CardDescription className="text-xs">
              The starting point of your screening flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              This node has no editable properties. Connect it to your first question.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedNode.type === 'question') {
    return (
      <QuestionProperties
        node={selectedNode}
        onUpdate={onUpdateNode}
        onDelete={onDeleteNode}
      />
    );
  }

  if (selectedNode.type === 'outcome') {
    return (
      <OutcomeProperties
        node={selectedNode}
        onUpdate={onUpdateNode}
        onDelete={onDeleteNode}
      />
    );
  }

  return null;
}

function QuestionProperties({
  node,
  onUpdate,
  onDelete,
}: {
  node: ScreenerNode;
  onUpdate: (nodeId: string, updates: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
}) {
  const data = node.data as QuestionNodeData;
  const [questionText, setQuestionText] = useState(data.questionText);
  const [required, setRequired] = useState(data.required);
  const [options, setOptions] = useState<string[]>(data.options || []);
  const [minValue, setMinValue] = useState(data.validation?.min?.toString() || '');
  const [maxValue, setMaxValue] = useState(data.validation?.max?.toString() || '');

  useEffect(() => {
    setQuestionText(data.questionText);
    setRequired(data.required);
    setOptions(data.options || []);
    setMinValue(data.validation?.min?.toString() || '');
    setMaxValue(data.validation?.max?.toString() || '');
  }, [data]);

  const handleUpdate = () => {
    const updates: Partial<QuestionNodeData> = {
      questionText,
      required,
    };

    if (data.questionType === 'multiple_choice') {
      updates.options = options;
    }

    if (data.questionType === 'numeric') {
      updates.validation = {
        min: minValue ? parseFloat(minValue) : undefined,
        max: maxValue ? parseFloat(maxValue) : undefined,
      };
    }

    onUpdate(node.id, updates);
  };

  const addOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Question Properties</h2>
          <p className="text-xs text-muted-foreground font-mono">{data.questionId}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(node.id)}
          data-testid="button-delete-node"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question-text" className="text-xs">Question Text *</Label>
          <Textarea
            id="question-text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            onBlur={handleUpdate}
            placeholder="Enter your question"
            className="text-sm"
            rows={3}
            data-testid="input-question-text"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="required" className="text-xs">Required</Label>
          <Switch
            id="required"
            checked={required}
            onCheckedChange={(checked) => {
              setRequired(checked);
              onUpdate(node.id, { required: checked });
            }}
            data-testid="switch-required"
          />
        </div>

        {data.questionType === 'multiple_choice' && (
          <div className="space-y-2">
            <Label className="text-xs">Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    onBlur={handleUpdate}
                    placeholder={`Option ${index + 1}`}
                    className="text-sm"
                    data-testid={`input-option-${index}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      removeOption(index);
                      setTimeout(handleUpdate, 0);
                    }}
                    data-testid={`button-remove-option-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addOption();
                  setTimeout(handleUpdate, 0);
                }}
                className="w-full"
                data-testid="button-add-option"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        {data.questionType === 'numeric' && (
          <div className="space-y-3">
            <Label className="text-xs">Validation</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="min-value" className="text-xs">Min Value</Label>
                <Input
                  id="min-value"
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  onBlur={handleUpdate}
                  placeholder="Min"
                  className="text-sm"
                  data-testid="input-min-value"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max-value" className="text-xs">Max Value</Label>
                <Input
                  id="max-value"
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  onBlur={handleUpdate}
                  placeholder="Max"
                  className="text-sm"
                  data-testid="input-max-value"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OutcomeProperties({
  node,
  onUpdate,
  onDelete,
}: {
  node: ScreenerNode;
  onUpdate: (nodeId: string, updates: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
}) {
  const data = node.data as OutcomeNodeData;
  const [outcome, setOutcome] = useState(data.outcome);
  const [message, setMessage] = useState(data.message || '');

  useEffect(() => {
    setOutcome(data.outcome);
    setMessage(data.message || '');
  }, [data]);

  const handleUpdate = () => {
    onUpdate(node.id, {
      outcome,
      message,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Outcome Properties</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(node.id)}
          data-testid="button-delete-node"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="outcome" className="text-xs">Outcome *</Label>
          <Select
            value={outcome}
            onValueChange={(value) => {
              setOutcome(value as typeof outcome);
              onUpdate(node.id, { outcome: value as typeof outcome });
            }}
          >
            <SelectTrigger id="outcome" data-testid="select-outcome">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ok_to_use">OK to Use</SelectItem>
              <SelectItem value="ask_a_doctor">Ask a Doctor</SelectItem>
              <SelectItem value="do_not_use">Do Not Use</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-xs">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={handleUpdate}
            placeholder="Message to display to the user"
            className="text-sm"
            rows={4}
            data-testid="input-outcome-message"
          />
        </div>
      </div>
    </div>
  );
}
