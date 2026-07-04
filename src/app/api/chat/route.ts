import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { answerConversation, classifyIntent, generateBlueprint, modifyBlueprint } from '@/lib/ai/claude-service';
import { generateBlueprintImages } from '@/lib/ai/image-service';
import { chatRequestSchema } from '@/lib/ai/schemas';
import type { BlueprintResponse } from '@/lib/ai/types';
import {
  ensureConversation,
  getBlueprintByProjectId,
  saveConversationMessage,
  saveGeneratedBlueprint
} from '@/lib/server/blueprint-persistence';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/server/supabase-admin';

function friendlyAiError(error: unknown) {
  if (error instanceof Error && error.message === 'MISSING_ANTHROPIC_API_KEY') {
    return 'AI generation is not configured yet. Please add your Anthropic API key.';
  }

  const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : undefined;
  if (status === 429) {
    return 'BlockBlueprint is receiving too many requests right now. Please wait a moment and try again.';
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to reach the AI service right now. Please try again.';
  }

  return 'Unable to process your message right now. Please try again.';
}

function statusForAiError(error: unknown) {
  if (error instanceof Error && error.message === 'MISSING_ANTHROPIC_API_KEY') {
    return 503;
  }

  const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : undefined;
  if (status === 429) return 429;
  if (status && status >= 500) return 502;

  return 500;
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ type: 'conversation', message: 'Blueprint storage is not configured yet.' }, { status: 503 });
  }

  const user = await getAuthenticatedUser(request, supabaseAdmin);
  if (!user) {
    return NextResponse.json({ type: 'conversation', message: 'Please sign in to use BlockBlueprint.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ type: 'conversation', message: 'Please send a valid message.' }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ type: 'conversation', message: parsed.error.issues[0]?.message ?? 'Please send a valid message.' }, { status: 400 });
  }

  const { message, projectId, conversationId } = parsed.data;

  try {
    const currentBlueprint = projectId ? await getBlueprintByProjectId(supabaseAdmin, user.id, projectId) : null;
    const resolvedConversationId = await ensureConversation({
      supabase: supabaseAdmin,
      userId: user.id,
      conversationId,
      projectId
    });

    const intent = await classifyIntent(message, Boolean(currentBlueprint));
    console.log('[BlockBlueprint AI] ✓ Prompt received', { intent, hasCurrentBlueprint: Boolean(currentBlueprint) });

    await saveConversationMessage({
      supabase: supabaseAdmin,
      userId: user.id,
      conversationId: resolvedConversationId,
      projectId,
      role: 'user',
      content: message,
      intent
    });

    if (intent === 'minecraft_build_request' || intent === 'blueprint_modification') {
      let blueprint: BlueprintResponse;
      try {
        blueprint =
          intent === 'blueprint_modification' && currentBlueprint
            ? await modifyBlueprint(message, currentBlueprint.blueprint_data)
            : await generateBlueprint(message);
      } catch (generationError) {
        if (generationError instanceof Error && generationError.message.startsWith('FOLLOW_UP_REQUIRED:')) {
          const followUpMessage = generationError.message.replace('FOLLOW_UP_REQUIRED:', '').trim();
          await saveConversationMessage({
            supabase: supabaseAdmin,
            userId: user.id,
            conversationId: resolvedConversationId,
            projectId,
            role: 'assistant',
            content: followUpMessage,
            intent
          });

          return NextResponse.json({ type: 'conversation', message: followUpMessage, conversationId: resolvedConversationId });
        }

        throw generationError;
      }
      console.log('[BlockBlueprint AI] ✓ Blueprint generated', {
        title: blueprint.title,
        sections: blueprint.sections.length,
        materials: blueprint.materials.length
      });

      let imageResult;
      try {
        imageResult = await generateBlueprintImages(blueprint);
        console.log('[BlockBlueprint image] ✓ Image received');
      } catch (imageError) {
        const imageMessage = imageError instanceof Error ? imageError.message : 'Unknown image generation error.';
        console.error('[BlockBlueprint image] Image generation failed:', imageError);
        imageResult = { status: 'failed' as const, error: imageMessage };
      }

      const saved = await saveGeneratedBlueprint({
        supabase: supabaseAdmin,
        userId: user.id,
        prompt: message,
        blueprint,
        projectId,
        conversationId: resolvedConversationId,
        existingBlueprintId: intent === 'blueprint_modification' ? currentBlueprint?.id : null,
        imageResult
      });
      console.log('[BlockBlueprint image] ✓ Image saved', {
        blueprintId: saved.blueprintId,
        projectId: saved.projectId,
        status: imageResult.status
      });

      await saveConversationMessage({
        supabase: supabaseAdmin,
        userId: user.id,
        conversationId: resolvedConversationId,
        projectId: saved.projectId,
        role: 'assistant',
        content: JSON.stringify(blueprint),
        intent
      });

      return NextResponse.json({
        ...blueprint,
        projectId: saved.projectId,
        conversationId: resolvedConversationId,
        blueprintId: saved.blueprintId,
        project: saved.dashboardBlueprint
      });
    }

    const conversation = await answerConversation(message, intent);

    await saveConversationMessage({
      supabase: supabaseAdmin,
      userId: user.id,
      conversationId: resolvedConversationId,
      projectId,
      role: 'assistant',
      content: conversation.message,
      intent
    });

    return NextResponse.json({ ...conversation, conversationId: resolvedConversationId });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('AI response validation failed:', error.issues);
    } else {
      console.error('Chat route failed:', error);
    }

    return NextResponse.json({ type: 'conversation', message: friendlyAiError(error) }, { status: statusForAiError(error) });
  }
}
