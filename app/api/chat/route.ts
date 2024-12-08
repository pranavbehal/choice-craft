/**
 * Chat API Route Handler
 *
 * Processes chat requests and generates AI responses using OpenAI's API.
 * Handles message formatting, progress tracking, and scene generation prompts.
 *
 * @route POST /api/chat
 */

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * POST request handler for chat interactions
 * @param {Request} req - Incoming request object containing messages and context
 * @returns {Response} Streamed AI response with formatted dialogue and metadata
 */
export async function POST(req: Request) {
  const { messages, systemMessage, currentProgress } = await req.json();

  const enhancedSystem = `${systemMessage}

  IMPORTANT: Return your responses as a JSON object with these fields:
  {
    "userResponse": "Your actual dialogue message starting with your name (e.g., 'Professor Blue: Hello!')",
    "imagePrompt": "Detailed scene description for image generation",
    "progress": number (0-100, current: ${currentProgress})
  }

  Progress Guidelines:
  - Increase progress when user makes good choices or advances the story
  - Decrease for poor choices or setbacks
  - Keep same if just asking questions or no significant action
  - Consider current progress (${currentProgress}) when deciding changes
  
  The user will only see the "userResponse" part. Make it natural and conversational.`;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: enhancedSystem,
    messages,
    temperature: 0.7,
    maxTokens: 500, // Increased to accommodate JSON
  });

  return result.toDataStreamResponse();
}
