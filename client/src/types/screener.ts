import { Node, Edge } from '@xyflow/react';

/**
 * Screener Question Types
 */
export type QuestionType = 'boolean' | 'choice' | 'numeric' | 'diagnostic_test';

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
 * EHR Mapping Configuration for Questions
 */
export interface EhrMapping {
  rule: 'optional' | 'mandatory';
  fhirPath: string; // e.g., 'Observation.ldl', 'Condition.diabetes'
  displayName: string; // User-friendly name for the data being requested
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
  ehrMapping?: EhrMapping; // Optional EHR integration configuration
  testType?: string; // For diagnostic_test questions - type of test required
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
 * Education Content Block Types
 */
export type EducationContentType = 'video' | 'text';

/**
 * Education Content Block
 */
export interface EducationContent {
  type: EducationContentType;
  url?: string; // For video type
  title?: string; // For video type
  markdown?: string; // For text type
}

/**
 * Education Module Configuration
 */
export interface EducationModule {
  required: boolean;
  content: EducationContent[];
}

/**
 * Comprehension Check Question
 */
export interface ComprehensionQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

/**
 * Comprehension Check Configuration
 */
export interface ComprehensionCheck {
  required: boolean;
  passingScore: number; // Percentage (0-100)
  questions: ComprehensionQuestion[];
  failOutcome: ScreenerOutcome; // Outcome if check fails
  allowRetry?: boolean; // Whether to allow one retry
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
  educationModule?: EducationModule; // Optional education content
  comprehensionCheck?: ComprehensionCheck; // Optional comprehension quiz
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
  ehrMapping?: EhrMapping; // Optional EHR integration configuration
  testType?: string; // For diagnostic_test questions - type of test required
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
