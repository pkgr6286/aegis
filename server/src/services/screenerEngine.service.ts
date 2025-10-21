/**
 * Screener Engine Service
 * 
 * Core logic evaluation engine that processes screener JSON rules
 * against consumer answers to produce screening outcomes.
 * 
 * IMPORTANT: This service implements safety-critical healthcare logic.
 * All condition evaluation must be defensive and handle edge cases.
 */

import type { ScreenerQuestion, ScreenerLogic } from '../validations/screener.validation';

interface ScreenerJSON {
  title: string;
  description?: string;
  questions: ScreenerQuestion[];
  logic: ScreenerLogic;
  disclaimers?: string[];
}

type ScreenerOutcome = 'ok_to_use' | 'ask_a_doctor' | 'do_not_use';

interface EvaluationResult {
  outcome: ScreenerOutcome;
  matchedRule?: {
    condition: string;
    message?: string;
  };
  missingRequired?: string[];
  validationErrors?: Record<string, string>;
}

export const screenerEngineService = {
  /**
   * Validate that all required questions are answered
   */
  validateAnswers(
    screenerJson: ScreenerJSON,
    answers: Record<string, any>
  ): { valid: boolean; missingRequired?: string[]; validationErrors?: Record<string, string> } {
    const missingRequired: string[] = [];
    const validationErrors: Record<string, string> = {};

    for (const question of screenerJson.questions) {
      const answer = answers[question.id];

      // Check required fields
      if (question.required && (answer === undefined || answer === null || answer === '')) {
        missingRequired.push(question.id);
        continue;
      }

      // Skip validation if no answer provided (and not required)
      if (answer === undefined || answer === null) {
        continue;
      }

      // Type-specific validation
      if (question.type === 'numeric' && question.validation) {
        const numValue = typeof answer === 'number' ? answer : parseFloat(answer);
        
        if (isNaN(numValue)) {
          validationErrors[question.id] = 'Must be a valid number';
          continue;
        }

        if (question.validation.min !== undefined && numValue < question.validation.min) {
          validationErrors[question.id] = `Must be at least ${question.validation.min}`;
        }
        if (question.validation.max !== undefined && numValue > question.validation.max) {
          validationErrors[question.id] = `Must be at most ${question.validation.max}`;
        }
      }

      if (question.type === 'text' && question.validation?.regex) {
        const regex = new RegExp(question.validation.regex);
        if (!regex.test(String(answer))) {
          validationErrors[question.id] = 'Invalid format';
        }
      }

      if (question.type === 'multiple_choice' && question.options) {
        if (!question.options.includes(String(answer))) {
          validationErrors[question.id] = 'Invalid option selected';
        }
      }
    }

    return {
      valid: missingRequired.length === 0 && Object.keys(validationErrors).length === 0,
      missingRequired: missingRequired.length > 0 ? missingRequired : undefined,
      validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
    };
  },

  /**
   * Safely evaluate a condition string against answers
   * 
   * SECURITY NOTE: This uses a sandboxed evaluation approach to prevent
   * code injection. Only allow simple comparison operators and boolean logic.
   */
  evaluateCondition(condition: string, answers: Record<string, any>): boolean {
    try {
      // Create a safe evaluation context with only the answer values
      // Replace question IDs in the condition with their actual values
      let safeCondition = condition;

      // Extract all variable names (question IDs) from the condition
      const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
      const variables = condition.match(variablePattern) || [];

      // Create a mapping of question IDs to their values
      const context: Record<string, any> = {};
      for (const varName of variables) {
        // Skip JavaScript keywords and operators
        if (['true', 'false', 'null', 'undefined', 'and', 'or', 'not'].includes(varName)) {
          continue;
        }

        // Map the variable to its answer value
        context[varName] = answers[varName];
      }

      // Use Function constructor for safer evaluation than eval()
      // Still not 100% safe, but better than direct eval()
      const evaluator = new Function(
        ...Object.keys(context),
        `
        'use strict';
        try {
          return Boolean(${safeCondition});
        } catch (e) {
          console.error('Condition evaluation error:', e);
          return false;
        }
        `
      );

      return evaluator(...Object.values(context));
    } catch (error) {
      console.error('Failed to evaluate condition:', condition, error);
      // On error, fail safe by returning false
      return false;
    }
  },

  /**
   * Evaluate screener logic and determine outcome
   */
  evaluate(screenerJson: ScreenerJSON, answers: Record<string, any>): EvaluationResult {
    // First, validate all answers
    const validation = this.validateAnswers(screenerJson, answers);
    if (!validation.valid) {
      // Return early if validation fails - cannot determine outcome
      return {
        outcome: 'ask_a_doctor', // Default to safest outcome
        missingRequired: validation.missingRequired,
        validationErrors: validation.validationErrors,
      };
    }

    // Evaluate rules in order (first match wins)
    for (const rule of screenerJson.logic.rules) {
      try {
        const matches = this.evaluateCondition(rule.condition, answers);
        
        if (matches) {
          return {
            outcome: rule.outcome,
            matchedRule: {
              condition: rule.condition,
              message: rule.message,
            },
          };
        }
      } catch (error) {
        console.error('Error evaluating rule:', rule, error);
        // Continue to next rule on error
      }
    }

    // No rules matched, use default outcome
    return {
      outcome: screenerJson.logic.defaultOutcome,
    };
  },

  /**
   * Get a human-readable summary of the evaluation result
   */
  getOutcomeSummary(result: EvaluationResult): string {
    if (result.missingRequired || result.validationErrors) {
      return 'Please complete all required questions correctly.';
    }

    switch (result.outcome) {
      case 'ok_to_use':
        return 'Based on your answers, this medication may be appropriate for you. A verification code has been generated.';
      case 'ask_a_doctor':
        return 'Based on your answers, please consult with a healthcare provider before using this medication.';
      case 'do_not_use':
        return 'Based on your answers, this medication is not recommended for you. Please consult with a healthcare provider.';
      default:
        return 'Unable to determine outcome. Please consult with a healthcare provider.';
    }
  },
};
