/**
 * AI Analyst Service
 * 
 * Provides RAG (Retrieval-Augmented Generation) powered analytics insights
 * Uses OpenAI GPT-5 to answer natural language questions about screening data
 */

import OpenAI from 'openai';
import { analyticsService } from './analytics.service';

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface AIAnalystQuery {
  query: string;
  tenantId: string;
  drugProgramId: string;
}

/**
 * Query the AI Analyst with a natural language question
 * 
 * This function implements RAG pattern:
 * 1. Fetches relevant analytics data as context
 * 2. Constructs a prompt with the user's question and data
 * 3. Calls OpenAI GPT-5 to generate insights
 * 4. Returns the AI's response
 */
export async function queryAI(params: AIAnalystQuery): Promise<string> {
  const { query, tenantId, drugProgramId } = params;

  try {
    // Step 1: Fetch all relevant analytics data as context
    const [
      overviewStats,
      screenerFunnel,
      pathPerformance,
      outcomesByQuestion,
      populationOutcomes,
      partnerPerformance,
    ] = await Promise.all([
      analyticsService.getOverviewStats(tenantId, drugProgramId),
      analyticsService.getScreenerFunnel(tenantId, drugProgramId),
      analyticsService.getPathPerformance(tenantId, drugProgramId),
      analyticsService.getOutcomesByQuestion(tenantId, drugProgramId),
      analyticsService.getPopulationOutcomes(tenantId, drugProgramId),
      analyticsService.getPartnerPerformance(tenantId, drugProgramId),
    ]);

    // Step 2: Build the context data structure
    const analyticsContext = {
      overview: overviewStats,
      funnel: screenerFunnel,
      pathComparison: pathPerformance,
      failureDrivers: outcomesByQuestion.slice(0, 20), // Top 20 failure drivers
      demographics: populationOutcomes,
      partners: partnerPerformance,
    };

    // Step 3: Construct the prompt
    const systemInstruction = `You are "Aegis Intelligence", an expert pharmaceutical regulatory and commercial analyst. 

Your role is to provide concise, data-driven insights to help pharmaceutical companies optimize their patient assistance programs.

Guidelines:
- Answer questions based ONLY on the structured JSON data provided
- Be specific and cite actual numbers from the data
- Identify trends, anomalies, and actionable insights
- Keep responses concise but insightful (2-4 paragraphs max)
- If the data is insufficient to answer the question, state that clearly
- Focus on commercial and regulatory implications
- Use professional language appropriate for pharma executives

Do not make up information or assumptions not supported by the data.`;

    const userPrompt = `USER QUESTION: ${query}

ANALYTICS DATA:
${JSON.stringify(analyticsContext, null, 2)}

Please analyze this data and provide insights to answer the user's question.`;

    // Step 4: Call OpenAI GPT-5
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 8192,
      temperature: 1, // gpt-5 always uses temperature 1
    });

    // Step 5: Extract and return the response
    const aiResponse = response.choices[0]?.message?.content || 'No response generated';

    return aiResponse;

  } catch (error) {
    console.error('Error in AI Analyst query:', error);
    throw new Error(`Failed to generate AI insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const aiAnalystService = {
  queryAI,
};
