/**
 * TypeScript types for Consumer Screening Flow
 * Public-facing patient screening application
 */

// ------------------------------------------------------------------
// BRAND CONFIGURATION
// ------------------------------------------------------------------

export interface BrandConfig {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

// ------------------------------------------------------------------
// SCREENER CONFIGURATION
// ------------------------------------------------------------------

export type QuestionType = 'boolean' | 'numeric' | 'choice' | 'text' | 'diagnostic_test';

export interface EhrMapping {
  rule: 'optional' | 'mandatory'; // Whether EHR connection is optional or required
  fhirPath: string; // FHIR resource path (e.g., 'Observation.LDL', 'Condition.diabetes')
  displayName?: string; // Friendly name to show user (e.g., 'LDL Cholesterol Level')
}

export interface ScreenerQuestion {
  id: string;
  type: QuestionType;
  text: string;
  helpText?: string;
  required: boolean;
  options?: string[]; // For 'choice' type questions
  min?: number; // For 'numeric' type questions
  max?: number; // For 'numeric' type questions
  ehrMapping?: EhrMapping; // EHR Fast Path configuration
  testType?: string; // For 'diagnostic_test' type questions - type of test required
}

export interface ScreenerRule {
  questionId: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'not_equals';
  value: any;
  action: 'show' | 'hide' | 'skip_to';
  targetQuestionId?: string; // For 'skip_to' actions
}

export interface EducationContent {
  type: 'video' | 'text';
  url?: string; // For video type
  title?: string; // For video type
  markdown?: string; // For text type
}

export interface EducationModule {
  required: boolean;
  content: EducationContent[];
}

export interface ComprehensionQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface ComprehensionCheck {
  required: boolean;
  passingScore: number; // Percentage (0-100)
  questions: ComprehensionQuestion[];
  failOutcome: 'ask_a_doctor' | 'do_not_use';
  allowRetry?: boolean;
}

export interface ScreenerConfig {
  id: string;
  version: string;
  questions: ScreenerQuestion[];
  rules: ScreenerRule[];
  evaluationLogic: {
    okToUse: any[]; // Array of condition objects
    askADoctor: any[]; // Array of condition objects
    doNotUse: any[]; // Array of condition objects
  };
  educationModule?: EducationModule;
  comprehensionCheck?: ComprehensionCheck;
}

// ------------------------------------------------------------------
// SCREENING SESSION
// ------------------------------------------------------------------

export type SessionStatus = 'started' | 'completed';
export type SessionOutcome = 'ok_to_use' | 'ask_a_doctor' | 'do_not_use';
export type SessionPath = 'manual' | 'ehr_assisted' | 'ehr_mandatory';

export interface ScreeningSession {
  id: string;
  drugProgramId: string;
  screenerVersionId: string;
  status: SessionStatus;
  outcome: SessionOutcome | null;
  path: SessionPath;
  answersJson: Record<string, any>;
  createdAt: string;
  completedAt: string | null;
}

export interface SessionEvaluation {
  outcome: SessionOutcome;
  reason: string;
  recommendedActions: string[];
}

// ------------------------------------------------------------------
// VERIFICATION CODE
// ------------------------------------------------------------------

export type CodeType = 'pos_barcode' | 'ecommerce_jwt';
export type CodeStatus = 'unused' | 'used' | 'expired';

export interface VerificationCode {
  code: string;
  type: CodeType;
  status: CodeStatus;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

// ------------------------------------------------------------------
// EHR INTEGRATION
// ------------------------------------------------------------------

export type ConsentStatus = 'granted' | 'revoked' | 'failed';

export interface EhrConsent {
  id: string;
  status: ConsentStatus;
  providerName?: string;
  scopesGranted?: string[];
  grantedAt: string;
  revokedAt?: string;
}

export interface EhrData {
  [key: string]: any; // Parsed FHIR data mapped to question IDs
}

// ------------------------------------------------------------------
// DRUG PROGRAM
// ------------------------------------------------------------------

export interface DrugProgram {
  id: string;
  name: string;
  slug: string;
  brandConfigId: string | null;
}

// ------------------------------------------------------------------
// API REQUEST/RESPONSE TYPES
// ------------------------------------------------------------------

export interface GetProgramResponse {
  success: boolean;
  data: {
    program: DrugProgram;
    screenerVersion: {
      id: string;
      version: string;
      screenerJson: ScreenerConfig;
      status: string;
    };
    brandConfig: BrandConfig | null;
  };
}

export interface CreateSessionRequest {
  programSlug: string;
}

export interface CreateSessionResponse {
  success: boolean;
  data: {
    session: ScreeningSession;
    screener: ScreenerConfig;
    sessionToken: string;
  };
}

export interface SubmitAnswersRequest {
  answersJson: Record<string, any>;
}

export interface SubmitAnswersResponse {
  success: boolean;
  data: {
    session: ScreeningSession;
    evaluation: SessionEvaluation;
  };
  message: string;
}

export interface GenerateCodeRequest {
  type?: CodeType;
}

export interface GenerateCodeResponse {
  success: boolean;
  data: VerificationCode;
  message: string;
}

export interface GetEhrConnectResponse {
  success: boolean;
  connectUrl: string;
  message: string;
}

export interface GetEhrDataResponse {
  success: boolean;
  data: EhrData;
}

// ------------------------------------------------------------------
// SCREENER ENGINE STATE
// ------------------------------------------------------------------

export interface ScreenerState {
  currentQuestionIndex: number;
  answers: Record<string, any>;
  questionHistory: string[]; // Stack of question IDs visited
  completedQuestions: Set<string>;
  isComplete: boolean;
}

// ------------------------------------------------------------------
// SESSION CONTEXT STATE
// ------------------------------------------------------------------

export interface SessionContextState {
  // Program and Brand
  programSlug: string | null;
  program: DrugProgram | null;
  brandConfig: BrandConfig | null;
  
  // Session
  sessionId: string | null;
  sessionToken: string | null;
  session: ScreeningSession | null;
  
  // Screener
  screenerConfig: ScreenerConfig | null;
  screenerState: ScreenerState;
  
  // Outcome
  evaluation: SessionEvaluation | null;
  verificationCode: VerificationCode | null;
  
  // EHR (optional)
  ehrConsent: EhrConsent | null;
  ehrData: EhrData | null;
}
