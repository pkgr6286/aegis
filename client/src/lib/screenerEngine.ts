/**
 * Screener Engine - Client-side logic for dynamic question flow
 * Handles branching, skip logic, and progress calculation
 */

import type { ScreenerConfig, ScreenerQuestion, ScreenerRule } from '@/types/consumer';

export class ScreenerEngine {
  private config: ScreenerConfig;
  private answers: Record<string, any>;

  constructor(config: ScreenerConfig, answers: Record<string, any> = {}) {
    this.config = {
      ...config,
      rules: config.rules || [], // Ensure rules is always an array
    };
    this.answers = answers;
  }

  /**
   * Update the answers
   */
  updateAnswers(answers: Record<string, any>) {
    this.answers = answers;
  }

  /**
   * Get total number of questions in the screener
   */
  getTotalQuestions(): number {
    return this.config.questions.length;
  }

  /**
   * Get question by index
   */
  getQuestionByIndex(index: number): ScreenerQuestion | null {
    if (index < 0 || index >= this.config.questions.length) {
      return null;
    }
    return this.config.questions[index];
  }

  /**
   * Get question by ID
   */
  getQuestionById(id: string): ScreenerQuestion | null {
    return this.config.questions.find(q => q.id === id) || null;
  }

  /**
   * Get current question by index
   */
  getCurrentQuestion(currentIndex: number): ScreenerQuestion | null {
    return this.getQuestionByIndex(currentIndex);
  }

  /**
   * Evaluate a single rule against current answers
   */
  private evaluateRule(rule: ScreenerRule): boolean {
    const answer = this.answers[rule.questionId];

    if (answer === undefined || answer === null) {
      return false;
    }

    switch (rule.operator) {
      case 'equals':
        return answer === rule.value;
      case 'not_equals':
        return answer !== rule.value;
      case 'greater_than':
        return Number(answer) > Number(rule.value);
      case 'less_than':
        return Number(answer) < Number(rule.value);
      default:
        return false;
    }
  }

  /**
   * Find applicable rules that are triggered by a specific question
   * Rules are only applicable if they reference the given question AND their condition is met
   */
  private getApplicableRulesForQuestion(questionId: string): ScreenerRule[] {
    return this.config.rules.filter(rule => {
      // Rule must be triggered by the specific question we're asking about
      if (rule.questionId !== questionId) {
        return false;
      }
      // Check if this rule's condition is met based on the answer
      return this.evaluateRule(rule);
    });
  }

  /**
   * Determine the next question index based on branching rules
   * ONLY applies rules triggered by the current question's answer
   */
  getNextQuestionIndex(currentIndex: number): number | null {
    const currentQuestion = this.getQuestionByIndex(currentIndex);
    if (!currentQuestion) {
      return null;
    }

    // Check if there are any skip_to rules triggered by THIS question
    const applicableRules = this.getApplicableRulesForQuestion(currentQuestion.id);
    const skipToRule = applicableRules.find(rule => rule.action === 'skip_to');

    if (skipToRule && skipToRule.targetQuestionId) {
      // Find the index of the target question
      const targetIndex = this.config.questions.findIndex(
        q => q.id === skipToRule.targetQuestionId
      );
      if (targetIndex !== -1) {
        return targetIndex;
      }
    }

    // No skip rule applies, go to next question
    const nextIndex = currentIndex + 1;
    if (nextIndex >= this.config.questions.length) {
      return null; // No more questions
    }

    // Check if the next question should be hidden based on ANY previous answer
    const nextQuestion = this.getQuestionByIndex(nextIndex);
    if (nextQuestion && !this.shouldShowQuestion(nextQuestion.id)) {
      // Recursively find the next visible question
      return this.getNextQuestionIndex(nextIndex);
    }

    return nextIndex;
  }

  /**
   * Check if a question should be displayed
   * A question is hidden if ANY previous answer triggers a hide rule targeting it
   */
  shouldShowQuestion(questionId: string): boolean {
    // Find all hide rules that target this question
    const hideRulesForQuestion = this.config.rules.filter(
      rule => rule.action === 'hide' && rule.targetQuestionId === questionId
    );

    // Check if any of these rules are currently triggered
    return !hideRulesForQuestion.some(rule => this.evaluateRule(rule));
  }

  /**
   * Calculate progress percentage (0-100)
   */
  calculateProgress(currentIndex: number): number {
    const total = this.getTotalQuestions();
    if (total === 0) return 0;
    
    // Progress is based on how many questions have been answered
    const answeredCount = Object.keys(this.answers).length;
    return Math.round((answeredCount / total) * 100);
  }

  /**
   * Check if all required questions have been answered
   */
  isComplete(): boolean {
    // Get all visible questions that are required
    const requiredQuestions = this.config.questions.filter(
      q => q.required && this.shouldShowQuestion(q.id)
    );

    // Check if all required questions have answers
    return requiredQuestions.every(q => {
      const answer = this.answers[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    });
  }

  /**
   * Validate an answer for a specific question
   */
  validateAnswer(questionId: string, value: any): { valid: boolean; error?: string } {
    const question = this.getQuestionById(questionId);
    if (!question) {
      return { valid: false, error: 'Question not found' };
    }

    // Check if required
    if (question.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: 'This field is required' };
    }

    // Type-specific validation
    if (value !== undefined && value !== null && value !== '') {
      switch (question.type) {
        case 'numeric':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return { valid: false, error: 'Must be a valid number' };
          }
          if (question.min !== undefined && numValue < question.min) {
            return { valid: false, error: `Must be at least ${question.min}` };
          }
          if (question.max !== undefined && numValue > question.max) {
            return { valid: false, error: `Must be at most ${question.max}` };
          }
          break;

        case 'choice':
          if (question.options && !question.options.includes(value)) {
            return { valid: false, error: 'Invalid option selected' };
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            return { valid: false, error: 'Must be true or false' };
          }
          break;
      }
    }

    return { valid: true };
  }

  /**
   * Get all answered questions
   */
  getAnsweredQuestions(): string[] {
    return Object.keys(this.answers);
  }

  /**
   * Get unanswered required questions
   */
  getUnansweredRequiredQuestions(): ScreenerQuestion[] {
    return this.config.questions.filter(q => {
      if (!q.required) return false;
      if (!this.shouldShowQuestion(q.id)) return false;
      const answer = this.answers[q.id];
      return answer === undefined || answer === null || answer === '';
    });
  }
}
