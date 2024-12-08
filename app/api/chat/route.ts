import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

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
