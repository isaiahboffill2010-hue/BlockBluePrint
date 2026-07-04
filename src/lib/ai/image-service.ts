import Anthropic from '@anthropic-ai/sdk';
import type { BlueprintResponse, GeneratedBlueprintImages } from './types';

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

function extractSvg(raw: string) {
  const text = raw.trim().replace(/^```(?:svg|xml)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = text.indexOf('<svg');
  const end = text.lastIndexOf('</svg>');

  if (start === -1 || end === -1) {
    throw new Error('Image response did not include complete SVG image data.');
  }

  return text.slice(start, end + '</svg>'.length).trim();
}

function svgToDataUrl(svg: string) {
  if (!svg.trim().startsWith('<svg')) {
    throw new Error('Image response did not include valid SVG image data.');
  }

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function createSvgImage({
  client,
  blueprint,
  label,
  focus,
  maxTokens = 2200
}: {
  client: Anthropic;
  blueprint: BlueprintResponse;
  label: string;
  focus: string;
  maxTokens?: number;
}) {
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: maxTokens,
    temperature: 0.35,
    system:
      'You are BlockBlueprint, an expert Minecraft concept artist. Return only one complete SVG document. Do not return JSON, markdown, explanations, or code fences.',
    messages: [
      {
        role: 'user',
        content: `Create one Minecraft-style voxel build SVG for this blueprint.

Image label: ${label}
Image focus: ${focus}

Requirements:
- Return only a single complete, valid, self-contained SVG document that starts with <svg and includes xmlns.
- Use a 16:10 viewBox, voxel/isometric block shapes, Minecraft-inspired materials, no Minecraft characters, logos, UI, or copyrighted marks.
- Keep the SVG concise but visually useful.

Blueprint JSON:
${JSON.stringify(blueprint)}`
      }
    ]
  });

  const text = getMessageText(response);
  if (!text) {
    throw new Error(`Image API returned an empty response for ${label}.`);
  }

  return extractSvg(text);
}

export async function generateBlueprintImages(blueprint: BlueprintResponse): Promise<GeneratedBlueprintImages> {
  logImageStage('Sending image requests', {
    title: blueprint.title,
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    views: IMAGE_VIEWS
  });

  const client = getClient();
  const viewEntries = await Promise.all(
    IMAGE_VIEWS.map(async (view) => {
      const focus =
        view === 'Perspective'
          ? 'Rich rendered three-quarter perspective of the complete build.'
          : `${view} orthographic construction blueprint view with clear block silhouettes.`;
      const svg = await createSvgImage({ client, blueprint, label: `${view} view`, focus });
      return [view, svgToDataUrl(svg)] as const;
    })
  );

  const views = Object.fromEntries(viewEntries) as Partial<Record<string, string>>;
  if (!views.Perspective) {
    throw new Error('Image response did not include a Perspective image.');
  }

  const sectionDiagrams = await Promise.all(
    blueprint.sections.map(async (section) => {
      const svg = await createSvgImage({
        client,
        blueprint: { ...blueprint, sections: [section] },
        label: `${section.name} section diagram`,
        focus: `Compact section diagram for ${section.name}: ${section.description}`,
        maxTokens: 1800
      });

      return {
        name: section.name,
        imageUrl: svgToDataUrl(svg)
      };
    })
  );

  logImageStage('Image data normalized', {
    views: Object.keys(views),
    sectionDiagrams: sectionDiagrams.length
  });

  return {
    status: 'ready',
    views,
    sectionDiagrams
  };
}
