import Anthropic from '@anthropic-ai/sdk';
import { blueprintResponseSchema, conversationResponseSchema, intentSchema } from './schemas';
import type { BlueprintResponse, ChatIntent, ConversationResponse } from './types';
import { extractJsonObject } from './json-utils';

const DEFAULT_MODEL = 'claude-sonnet-4-5';

const SYSTEM_PROMPT =
  'You are BlockBlueprint, an expert Minecraft architect. Help users design Minecraft structures. Ask concise follow-up questions when the request is unclear instead of guessing. Never use markdown when JSON is requested.';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_ANTHROPIC_API_KEY');
  }

  return new Anthropic({ apiKey });
}

function getMessageText(message: Anthropic.Messages.Message) {
  return message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function parseJsonObject(text: string): unknown {
  // Claude occasionally returns extra text around JSON; extract the JSON object robustly.
  const candidate = extractJsonObject(text);
  try {
    return JSON.parse(candidate);
  } catch (err) {
    // Include a small preview in the thrown error for easier debugging.
    const preview = candidate.slice(0, 2500);
    throw new Error(`INVALID_AI_JSON: ${String((err as Error)?.message)} Preview=${preview}`);
  }
}

async function createTextMessage(system: string, content: string, maxTokens = 1200) {

  const client = getClient();
  return client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: maxTokens,
    temperature: 0.2,
    system,
    messages: [{ role: 'user', content }]
  });
}

export async function classifyIntent(message: string, hasCurrentBlueprint: boolean): Promise<ChatIntent> {
  const response = await createTextMessage(
    `${SYSTEM_PROMPT}

Classify the user's message into exactly one intent:
- conversation
- minecraft_build_request
- blueprint_modification
- minecraft_question
- app_question

Return only valid JSON with this shape:
{"intent":"conversation","confidence":0.95,"reason":"short reason"}

Use minecraft_build_request only when the user is asking to create/design/build a new structure.
Use blueprint_modification only when a current blueprint exists and the user asks to change it.
Use minecraft_question for general Minecraft building questions.
Use app_question for questions about BlockBlueprint features or usage.`,
    `Current blueprint exists: ${hasCurrentBlueprint ? 'yes' : 'no'}
User message: ${message}`,
    400
  );

  const parsed = intentSchema.parse(parseJsonObject(getMessageText(response)));
  if (parsed.intent === 'blueprint_modification' && !hasCurrentBlueprint) {
    return 'minecraft_build_request';
  }

  return parsed.intent;
}

export async function answerConversation(message: string, intent: ChatIntent): Promise<ConversationResponse> {
  const response = await createTextMessage(
    `${SYSTEM_PROMPT}

Return only valid JSON:
{"type":"conversation","message":"..."}

Be warm, concise, and useful. Do not generate a blueprint. If the user asks what you can do, explain that you can chat, answer Minecraft build questions, and create or modify blueprints when asked.`,
    `Intent: ${intent}
User message: ${message}`,
    700
  );

  return conversationResponseSchema.parse(parseJsonObject(getMessageText(response)));
}

export async function generateBlueprint(message: string): Promise<BlueprintResponse> {
  const response = await createTextMessage(
    `${SYSTEM_PROMPT}

Generate a Minecraft build blueprint. Return only valid JSON. Never return markdown, explanations, or code fences.

Use this exact shape:
{
  "type": "blueprint",
  "title": "Medieval Castle",
  "description": "...",
  "difficulty": "Hard",
  "estimatedTime": "2h 40m",
  "estimatedBlocks": 3482,
  "dimensions": { "width": 48, "length": 52, "height": 36 },
  "style": "...",
  "biomeRecommendation": "...",
  "materials": [{ "label": "...", "count": 0 }],
  "sections": [
    {
      "name": "Foundation",
      "description": "...",
      "estimatedTime": "20 min",
      "status": "pending",
      "layers": [
        {
          "name": "Layer 1",
          "description": "...",
          "yLevel": 0,
          "materials": [{ "label": "...", "count": 0 }],
          "instructions": ["..."]
        }
      ]
    }
  ]
}

If the user request is too vague to design responsibly, return {"type":"conversation","message":"..."} asking one focused follow-up question instead.`,
    `User build request: ${message}`,
    2400
  );

  const parsed = parseJsonObject(getMessageText(response));
  const maybeConversation = conversationResponseSchema.safeParse(parsed);
  if (maybeConversation.success) {
    throw new Error(`FOLLOW_UP_REQUIRED:${maybeConversation.data.message}`);
  }

  return blueprintResponseSchema.parse(parsed);
}

export async function modifyBlueprint(message: string, currentBlueprint: unknown): Promise<BlueprintResponse> {
  const response = await createTextMessage(
    `${SYSTEM_PROMPT}

Modify the current blueprint according to the user request. Preserve useful existing details and update only what should change. Return only valid JSON using the same blueprint shape. Never return markdown or code fences.`,
    `Current blueprint JSON:
${JSON.stringify(currentBlueprint)}

User modification request: ${message}`,
    2600
  );

  return blueprintResponseSchema.parse(parseJsonObject(getMessageText(response)));
}
