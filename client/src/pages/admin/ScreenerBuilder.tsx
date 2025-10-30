import { useState, useCallback, useRef, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, Eye, Rocket, Plus, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import type { ScreenerNode, ScreenerEdge, QuestionType, ScreenerJSON, QuestionNodeData } from '@/types/screener';
import { StartNode } from '@/components/screener/nodes/StartNode';
import { QuestionNode } from '@/components/screener/nodes/QuestionNode';
import { OutcomeNode } from '@/components/screener/nodes/OutcomeNode';
import { NodePalette } from '@/components/screener/NodePalette';
import { PropertiesInspector } from '@/components/screener/PropertiesInspector';
import { ScreenerSettings } from '@/components/screener/ScreenerSettings';
import { BooleanQuestion } from '@/components/consumer/questions/BooleanQuestion';
import { NumericQuestion } from '@/components/consumer/questions/NumericQuestion';
import { ChoiceQuestion } from '@/components/consumer/questions/ChoiceQuestion';
import type { EducationModule, ComprehensionCheck } from '@/types/screener';

const nodeTypes: NodeTypes = {
  start: StartNode,
  question: QuestionNode,
  outcome: OutcomeNode,
};

const initialNodes: ScreenerNode[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: 'Start' },
  },
];

const initialEdges: ScreenerEdge[] = [];

export default function ScreenerBuilder() {
  const [match, params] = useRoute('/admin/programs/:programId/screener/:versionId');
  const [, setLocation] = useLocation();
  const { programId, versionId } = params || {};
  const { toast } = useToast();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [educationModule, setEducationModule] = useState<EducationModule | undefined>();
  const [comprehensionCheck, setComprehensionCheck] = useState<ComprehensionCheck | undefined>();
  const nodeIdCounter = useRef(1);

  const isNewVersion = versionId === 'new';

  // Fetch all screener versions for this program
  const { data: screenersData, isLoading } = useQuery<{success: boolean; data: any[]}>({
    queryKey: [`/api/v1/admin/drug-programs/${programId}/screeners`],
    enabled: !isNewVersion && !!programId && !!versionId,
  });

  // Load nodes and edges from screener data
  useEffect(() => {
    if (screenersData?.data && !isLoaded && !isNewVersion) {
      // Find the screener version we're editing
      const screenerVersion = screenersData.data.find((s: any) => s.id === versionId);
      if (screenerVersion?.screenerJson) {
        const screenerJson = screenerVersion.screenerJson;
        if (screenerJson.nodes && screenerJson.edges) {
          setNodes(screenerJson.nodes);
          setEdges(screenerJson.edges);
          setEducationModule(screenerJson.educationModule);
          setComprehensionCheck(screenerJson.comprehensionCheck);
          setIsLoaded(true);
          
          // Show success message
          toast({
            title: 'Screener loaded',
            description: `Version ${screenerVersion.version} loaded successfully`,
          });
        }
      }
    }
  }, [screenersData, isLoaded, isNewVersion, versionId, setNodes, setEdges, toast]);

  const handleBack = () => {
    setLocation(`/admin/programs/${programId}`);
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: ScreenerNode) => {
      setSelectedNodeId(node.id);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const addNode = useCallback(
    (type: 'question' | 'outcome', questionType?: QuestionType) => {
      const id = `node-${++nodeIdCounter.current}`;
      const position = {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 200,
      };

      let newNode: ScreenerNode;

      if (type === 'question' && questionType) {
        newNode = {
          id,
          type: 'question',
          position,
          data: {
            label: `Question ${nodeIdCounter.current}`,
            questionId: `q${nodeIdCounter.current}`,
            questionType,
            questionText: 'Enter your question here',
            required: true,
            options: questionType === 'choice' ? ['Option 1', 'Option 2'] : undefined,
          },
        };
      } else {
        // outcome node
        newNode = {
          id,
          type: 'outcome',
          position,
          data: {
            label: 'Outcome',
            outcome: 'ok_to_use',
            message: 'You may use this medication.',
          },
        };
      }

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
    },
    [setNodes]
  );

  const updateNodeData = useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [setNodes, setEdges, selectedNodeId]
  );

  const handleUpdateSettings = useCallback((settings: { educationModule?: EducationModule; comprehensionCheck?: ComprehensionCheck }) => {
    setEducationModule(settings.educationModule);
    setComprehensionCheck(settings.comprehensionCheck);
    toast({
      title: 'Settings updated',
      description: 'Education and comprehension check settings have been updated.',
    });
  }, [toast]);

  const handleSaveDraft = () => {
    toast({
      title: 'Draft saved',
      description: 'Your screener has been saved as a draft.',
    });
    // TODO: Implement API call to save draft
  };

  const handlePublish = () => {
    toast({
      title: 'Screener published',
      description: 'Your screener is now live for consumers.',
    });
    // TODO: Implement API call to publish
  };

  const handlePreview = () => {
    // Convert nodes to screener questions
    const questionNodes = nodes.filter(n => n.type === 'question');
    if (questionNodes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No questions found',
        description: 'Add at least one question to preview the screener.',
      });
      return;
    }
    
    setPreviewQuestionIndex(0);
    setPreviewAnswers({});
    setShowPreview(true);
  };

  // Convert nodes to screener questions for preview
  const previewQuestions = nodes
    .filter(n => n.type === 'question')
    .map(n => {
      const data = n.data as QuestionNodeData;
      return {
        id: data.questionId,
        type: data.questionType,
        text: data.questionText,
        required: data.required,
        options: data.options,
        validation: data.validation,
      };
    });

  const currentPreviewQuestion = previewQuestions[previewQuestionIndex];
  const currentPreviewAnswer = currentPreviewQuestion ? previewAnswers[currentPreviewQuestion.id] : null;

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-page-title">
              {isNewVersion ? 'Create Screener Version' : 'Edit Screener Version'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Build your patient screening workflow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            data-testid="button-preview"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            data-testid="button-save-draft"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            data-testid="button-publish"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Node Palette */}
        <div className="w-64 border-r bg-muted/30 overflow-y-auto">
          <NodePalette onAddNode={addNode} />
        </div>

        {/* Center Panel - React Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            data-testid="canvas-flow"
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Right Panel - Properties Inspector / Settings */}
        <div className="w-80 border-l bg-muted/30 flex flex-col">
          {/* Toggle between Properties and Settings */}
          <div className="flex border-b bg-background">
            <Button
              variant={showSettings ? 'ghost' : 'default'}
              size="sm"
              className="flex-1 rounded-none"
              onClick={() => setShowSettings(false)}
              data-testid="button-show-properties"
            >
              Properties
            </Button>
            <Button
              variant={showSettings ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-none"
              onClick={() => setShowSettings(true)}
              data-testid="button-show-settings"
            >
              Settings
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {showSettings ? (
              <ScreenerSettings
                educationModule={educationModule}
                comprehensionCheck={comprehensionCheck}
                onUpdate={handleUpdateSettings}
              />
            ) : (
              <PropertiesInspector
                selectedNode={selectedNode}
                onUpdateNode={updateNodeData}
                onDeleteNode={deleteNode}
              />
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Screener</DialogTitle>
          </DialogHeader>

          {currentPreviewQuestion ? (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Question {previewQuestionIndex + 1} of {previewQuestions.length}</span>
                <span>{Math.round(((previewQuestionIndex + 1) / previewQuestions.length) * 100)}% Complete</span>
              </div>

              {/* Question Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {currentPreviewQuestion.text}
                    {currentPreviewQuestion.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Render appropriate question type */}
                  {currentPreviewQuestion.type === 'boolean' && (
                    <BooleanQuestion
                      value={currentPreviewAnswer}
                      onChange={(value) => setPreviewAnswers(prev => ({
                        ...prev,
                        [currentPreviewQuestion.id]: value
                      }))}
                    />
                  )}

                  {currentPreviewQuestion.type === 'choice' && currentPreviewQuestion.options && (
                    <ChoiceQuestion
                      options={currentPreviewQuestion.options}
                      value={currentPreviewAnswer}
                      onChange={(value) => setPreviewAnswers(prev => ({
                        ...prev,
                        [currentPreviewQuestion.id]: value
                      }))}
                    />
                  )}

                  {currentPreviewQuestion.type === 'numeric' && (
                    <NumericQuestion
                      value={currentPreviewAnswer || ''}
                      onChange={(value) => setPreviewAnswers(prev => ({
                        ...prev,
                        [currentPreviewQuestion.id]: value
                      }))}
                      min={currentPreviewQuestion.validation?.min}
                      max={currentPreviewQuestion.validation?.max}
                    />
                  )}
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={previewQuestionIndex === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {previewQuestionIndex < previewQuestions.length - 1 ? (
                    <Button
                      onClick={() => setPreviewQuestionIndex(prev => prev + 1)}
                      disabled={currentPreviewQuestion.required && currentPreviewAnswer == null}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        toast({
                          title: 'Preview complete!',
                          description: 'This is how your screener will look to consumers.',
                        });
                        setShowPreview(false);
                      }}
                      disabled={currentPreviewQuestion.required && currentPreviewAnswer == null}
                    >
                      Finish Preview
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Debug info */}
              <div className="text-xs text-muted-foreground text-center">
                Preview Mode - This is how consumers will see your screener
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No questions to preview
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
