/**
 * Session Context for Consumer Screening Flow
 * Manages state for public-facing patient screening
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  SessionContextState,
  DrugProgram,
  BrandConfig,
  ScreeningSession,
  ScreenerConfig,
  SessionEvaluation,
  VerificationCode,
  EhrConsent,
  EhrData,
  ScreenerState,
} from '@/types/consumer';

interface SessionContextType extends SessionContextState {
  // Program and Brand
  setProgramData: (
    program: DrugProgram,
    brandConfig: BrandConfig | null,
    screenerConfig: ScreenerConfig
  ) => void;

  // Session
  setSession: (sessionId: string, sessionToken: string, session: ScreeningSession) => void;
  clearSession: () => void;

  // Screener State
  updateAnswer: (questionId: string, value: any) => void;
  setCurrentQuestion: (index: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  markQuestionComplete: (questionId: string) => void;
  setScreenerComplete: () => void;

  // Outcome
  setEvaluation: (evaluation: SessionEvaluation) => void;
  setVerificationCode: (code: VerificationCode) => void;

  // EHR (optional)
  setEhrConsent: (consent: EhrConsent) => void;
  setEhrData: (data: EhrData) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const initialScreenerState: ScreenerState = {
  currentQuestionIndex: 0,
  answers: {},
  questionHistory: [],
  completedQuestions: new Set<string>(),
  isComplete: false,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [programSlug, setProgramSlug] = useState<string | null>(null);
  const [program, setProgram] = useState<DrugProgram | null>(null);
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [session, setSessionState] = useState<ScreeningSession | null>(null);

  const [screenerConfig, setScreenerConfig] = useState<ScreenerConfig | null>(null);
  const [screenerState, setScreenerState] = useState<ScreenerState>(initialScreenerState);

  const [evaluation, setEvaluationState] = useState<SessionEvaluation | null>(null);
  const [verificationCode, setVerificationCodeState] = useState<VerificationCode | null>(null);

  const [ehrConsent, setEhrConsentState] = useState<EhrConsent | null>(null);
  const [ehrData, setEhrDataState] = useState<EhrData | null>(null);

  const setProgramData = useCallback((
    prog: DrugProgram,
    brand: BrandConfig | null,
    screener: ScreenerConfig
  ) => {
    setProgramSlug(prog.slug);
    setProgram(prog);
    setBrandConfig(brand);
    setScreenerConfig(screener);
  }, []);

  const setSession = useCallback((id: string, token: string, sess: ScreeningSession) => {
    setSessionId(id);
    setSessionToken(token);
    setSessionState(sess);
  }, []);

  const clearSession = useCallback(() => {
    setProgramSlug(null);
    setProgram(null);
    setBrandConfig(null);
    setSessionId(null);
    setSessionToken(null);
    setSessionState(null);
    setScreenerConfig(null);
    setScreenerState(initialScreenerState);
    setEvaluationState(null);
    setVerificationCodeState(null);
    setEhrConsentState(null);
    setEhrDataState(null);
  }, []);

  const updateAnswer = useCallback((questionId: string, value: any) => {
    setScreenerState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value,
      },
    }));
  }, []);

  const setCurrentQuestion = useCallback((index: number) => {
    setScreenerState(prev => ({
      ...prev,
      currentQuestionIndex: index,
    }));
  }, []);

  const goToNextQuestion = useCallback(() => {
    setScreenerState(prev => {
      const currentQuestion = screenerConfig?.questions[prev.currentQuestionIndex];
      const newHistory = currentQuestion
        ? [...prev.questionHistory, currentQuestion.id]
        : prev.questionHistory;

      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        questionHistory: newHistory,
      };
    });
  }, [screenerConfig]);

  const goToPreviousQuestion = useCallback(() => {
    setScreenerState(prev => {
      if (prev.questionHistory.length === 0) return prev;

      const newHistory = [...prev.questionHistory];
      newHistory.pop(); // Remove last visited question

      return {
        ...prev,
        currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
        questionHistory: newHistory,
      };
    });
  }, []);

  const markQuestionComplete = useCallback((questionId: string) => {
    setScreenerState(prev => ({
      ...prev,
      completedQuestions: new Set(prev.completedQuestions).add(questionId),
    }));
  }, []);

  const setScreenerComplete = useCallback(() => {
    setScreenerState(prev => ({
      ...prev,
      isComplete: true,
    }));
  }, []);

  const setEvaluation = useCallback((evaluation: SessionEvaluation) => {
    setEvaluationState(evaluation);
  }, []);

  const setVerificationCode = useCallback((code: VerificationCode) => {
    setVerificationCodeState(code);
  }, []);

  const setEhrConsent = useCallback((consent: EhrConsent) => {
    setEhrConsentState(consent);
  }, []);

  const setEhrData = useCallback((data: EhrData) => {
    setEhrDataState(data);
  }, []);

  const value: SessionContextType = {
    // State
    programSlug,
    program,
    brandConfig,
    sessionId,
    sessionToken,
    session,
    screenerConfig,
    screenerState,
    evaluation,
    verificationCode,
    ehrConsent,
    ehrData,

    // Methods
    setProgramData,
    setSession,
    clearSession,
    updateAnswer,
    setCurrentQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    markQuestionComplete,
    setScreenerComplete,
    setEvaluation,
    setVerificationCode,
    setEhrConsent,
    setEhrData,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}
