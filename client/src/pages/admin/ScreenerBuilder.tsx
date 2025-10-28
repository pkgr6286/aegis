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
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save, Eye, Rocket, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import type { ScreenerNode, ScreenerEdge, QuestionType } from '@/types/screener';
import { StartNode } from '@/components/screener/nodes/StartNode';
import { QuestionNode } from '@/components/screener/nodes/QuestionNode';
import { OutcomeNode } from '@/components/screener/nodes/OutcomeNode';
import { NodePalette } from '@/components/screener/NodePalette';
import { PropertiesInspector } from '@/components/screener/PropertiesInspector';

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
    toast({
      title: 'Preview mode',
      description: 'Preview functionality coming soon.',
    });
    // TODO: Implement preview mode
  };

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

        {/* Right Panel - Properties Inspector */}
        <div className="w-80 border-l bg-muted/30 overflow-y-auto">
          <PropertiesInspector
            selectedNode={selectedNode}
            onUpdateNode={updateNodeData}
            onDeleteNode={deleteNode}
          />
        </div>
      </div>
    </div>
  );
}
