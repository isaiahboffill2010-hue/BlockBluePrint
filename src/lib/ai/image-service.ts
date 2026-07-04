import Anthropic from '@anthropic-ai/sdk';
import type { BlueprintResponse, GeneratedBlueprintImages } from './types';
import { extractJsonObject } from './json-utils';


const DEFAULT_MODEL = 'claude-sonnet-4-5';
const IMAGE_VIEWS = ['Perspective', 'Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'];

function logImageStage(stage: string, details?: unknown) {
  if (details === undefined) {
    console.log(`[BlockBlueprint image] ${stage}`);
    return;
  }

  console.log(`[BlockBlueprint image] ${stage}`, details);
}

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
  const candidate = extractJsonObject(text);

  try {
    return JSON.parse(candidate);
  } catch (err) {
    const preview = candidate.slice(0, 2500);
    throw new Error(`INVALID_AI_JSON (image): ${String((err as Error)?.message)} Preview=${preview}`);
  }
}


function svgToDataUrl(svg: string) {
  if (!svg.trim().startsWith('<svg')) {
    throw new Error('Image response did not include valid SVG image data.');
  }

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function readSvgMap(value: unknown) {
  if (!value || typeof value !== 'object') return {};

  return Object.entries(value as Record<string, unknown>).reduce<Partial<Record<string, string>>>((images, [key, svg]) => {
    if (typeof svg === 'string' && svg.trim()) {
      images[key] = svgToDataUrl(svg);
    }

    return images;
  }, {});
}

export async function generateBlueprintImages(blueprint: BlueprintResponse): Promise<GeneratedBlueprintImages> {
  logImageStage('✓ Sending image request', {
    title: blueprint.title,
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    views: IMAGE_VIEWS
  });

  const client = getClient();
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: 6000,
    temperature: 0.35,
    system:
      'You are BlockBlueprint, an expert Minecraft concept artist. Return only valid JSON. Generate SVG image data, not prose.',
    messages: [
      {
        role: 'user',
        content: `Create Minecraft-style voxel build images for this blueprint.

Return only valid JSON with this exact shape:
{
  "views": {
    "Perspective": "<svg ...>...</svg>",
    "Front": "<svg ...>...</svg>",
    "Back": "<svg ...>...</svg>",
    "Left": "<svg ...>...</svg>",
    "Right": "<svg ...>...</svg>",
    "Top": "<svg ...>...</svg>",
    "Bottom": "<svg ...>...</svg>"
  },
  "sectionDiagrams": [
    { "name": "Foundation", "svg": "<svg ...>...</svg>" }
  ]
}

Requirements:
- Each SVG must be complete, valid, self-contained, and include xmlns.
- Use a 16:10 viewBox, voxel/isometric block shapes, Minecraft-inspired materials, no Minecraft characters, logos, UI, or copyrighted marks.
- Perspective should be the richest rendered build image.
- Orthographic views should look like blueprint/construction diagrams.
- Create one compact section diagram for each blueprint section.
- Keep SVGs concise.

Blueprint JSON:
${JSON.stringify(blueprint)}`
      }
    ]
  });

  const text = getMessageText(response);
  if (!text) {
    throw new Error('Image API returned an empty response.');
  }

  logImageStage('✓ Image response received', { bytes: text.length });

  const parsed = parseJsonObject(text) as {
    views?: unknown;
    sectionDiagrams?: Array<{ name?: unknown; svg?: unknown }>;
  };

  const views = readSvgMap(parsed.views);
  if (!views.Perspective) {
    throw new Error('Image response did not include a Perspective image.');
  }

  const sectionDiagrams = Array.isArray(parsed.sectionDiagrams)
    ? parsed.sectionDiagrams
        .filter((diagram) => typeof diagram.name === 'string' && typeof diagram.svg === 'string')
        .map((diagram) => ({
          name: diagram.name as string,
          imageUrl: svgToDataUrl(diagram.svg as string)
        }))
    : [];

  logImageStage('✓ Image data normalized', {
    views: Object.keys(views),
    sectionDiagrams: sectionDiagrams.length
  });

  return {
    status: 'ready',
    views,
    sectionDiagrams
  };
}
