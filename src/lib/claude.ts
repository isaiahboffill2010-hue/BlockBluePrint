import Anthropic from '@anthropic-ai/sdk';

export interface BlueprintContent {
  name?: string;
  difficulty?: string;
  estimated_build_time?: string;
  block_count?: number;
  dimensions?: string;
  style?: string;
  description?: string;
  preview_image_url?: string | null;
  materials?: Array<{ label: string; count: number }>;
  sections?: Array<{
    title: string;
    status?: string;
    estimated_time?: string;
    blocks?: number;
    overview?: string;
    layers?: Array<{ title: string; blocks?: number; overview?: string }>;
  }>;
}

const DEFAULT_MODEL = 'claude-sonnet-4-5';

function getTextFromMessage(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function parseBlueprintJson(text: string): BlueprintContent {
  try {
    return JSON.parse(text) as BlueprintContent;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as BlueprintContent;
    }

    throw new Error('The blueprint response could not be read. Please try again.');
  }
}

export async function generateBlueprint(prompt: string): Promise<BlueprintContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Blueprint generation is not configured yet.');
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: 1200,
    temperature: 0.2,
    system:
      'You are an AI Minecraft architect. Return only a single valid JSON object and no markdown, comments, or extra prose.',
    messages: [
      {
        role: 'user',
        content: `Generate a Minecraft build blueprint using this exact structure:
{
  "name": "...",
  "difficulty": "...",
  "estimated_build_time": "...",
  "block_count": 0,
  "dimensions": "...",
  "style": "...",
  "description": "...",
  "preview_image_url": null,
  "materials": [
    { "label": "...", "count": 0 }
  ],
  "sections": [
    {
      "title": "...",
      "status": "...",
      "estimated_time": "...",
      "blocks": 0,
      "overview": "...",
      "layers": [
        { "title": "...", "blocks": 0, "overview": "..." }
      ]
    }
  ]
}

User prompt: ${prompt}`
      }
    ]
  });

  const text = getTextFromMessage(message);

  if (!text) {
    throw new Error('The blueprint response was empty. Please try again.');
  }

  return parseBlueprintJson(text);
}
