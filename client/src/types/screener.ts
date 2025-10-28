import { Node, Edge } from '@xyflow/react';

/**
 * Screener Question Types
 */
export type QuestionType = 'boolean' | 'choice' | 'numeric';

/**
 * Screener Outcome Types
 */
export type ScreenerOutcome = 'ok_to_use' | 'ask_a_doctor' | 'do_not_use';

/**
 * Question Validation Rules
 */
export interface QuestionValidation {
  min?: number;
  max?: number;
  regex?: string;
}

/**
 * Screener Question
 */
export interface ScreenerQuestion {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[]; // For choice questions
  validation?: QuestionValidation;
}

/**
 * Screener Logic Rule
 */
export interface ScreenerRule {
  condition: string; // e.g., "q1 == 'yes' && q5 > 130"
  outcome: ScreenerOutcome;
  message?: string;
}

/**
 * Screener Logic
 */
export interface ScreenerLogic {
  rules: ScreenerRule[];
  defaultOutcome: ScreenerOutcome;
}

/**
 * Complete Screener JSON
 */
export interface ScreenerJSON {
  title: string;
  description?: string;
  questions: ScreenerQuestion[];
  logic: ScreenerLogic;
  disclaimers?: string[];
  nodes?: ScreenerNode[]; // Visual flow nodes for builder
  edges?: ScreenerEdge[]; // Visual flow edges for builder
}

/**
 * Screener Version (from API)
 */
export interface ScreenerVersion {
  id: string;
  tenantId: string;
  drugProgramId: string;
  version: number;
  screenerJson: ScreenerJSON;
  notes?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * React Flow Node Types
 */
export type FlowNodeType = 'start' | 'question' | 'outcome';

/**
 * Base Node Data
 */
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
}

/**
 * Start Node Data
 */
export interface StartNodeData extends BaseNodeData {
  label: 'Start';
}

/**
 * Question Node Data
 */
export interface QuestionNodeData extends BaseNodeData {
  questionId: string;
  questionType: QuestionType;
  questionText: string;
  required: boolean;
  options?: string[];
  validation?: QuestionValidation;
}

/**
 * Outcome Node Data
 */
export interface OutcomeNodeData extends BaseNodeData {
  outcome: ScreenerOutcome;
  message?: string;
}

/**
 * Union of all node data types
 */
export type ScreenerNodeData = StartNodeData | QuestionNodeData | OutcomeNodeData;

/**
 * Screener Flow Node
 */
export type ScreenerNode = Node<ScreenerNodeData, FlowNodeType>;

/**
 * Screener Flow Edge
 */
export type ScreenerEdge = Edge;

/**
 * Builder State
 */
export interface BuilderState {
  nodes: ScreenerNode[];
  edges: ScreenerEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;
}

/**
 * Form data for creating/updating screener version
 */
export interface ScreenerVersionFormData {
  notes?: string;
  status: 'draft' | 'published';
}
