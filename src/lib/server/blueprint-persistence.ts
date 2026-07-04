import type { SupabaseClient } from '@supabase/supabase-js';
import type { BlueprintResponse, GeneratedBlueprintImages } from '@/lib/ai/types';

export function toDashboardBlueprintData(
  blueprint: BlueprintResponse,
  imageResult?: GeneratedBlueprintImages | { status: 'failed'; error: string }
) {
  const sectionDiagrams =
    imageResult?.status === 'ready'
      ? imageResult.sectionDiagrams.reduce<Record<string, string>>((diagrams, diagram) => {
          diagrams[diagram.name] = diagram.imageUrl;
          return diagrams;
        }, {})
      : {};

  return {
    name: blueprint.title,
    difficulty: blueprint.difficulty,
    estimated_build_time: blueprint.estimatedTime,
    block_count: blueprint.estimatedBlocks,
    dimensions: `${blueprint.dimensions.width} x ${blueprint.dimensions.length} x ${blueprint.dimensions.height}`,
    style: blueprint.style,
    biome_recommendation: blueprint.biomeRecommendation,
    description: blueprint.description,
    preview_image_url: imageResult?.status === 'ready' ? imageResult.views.Perspective ?? null : null,
    image_generation_status: imageResult?.status ?? 'pending',
    image_generation_error: imageResult?.status === 'failed' ? imageResult.error : null,
    views: imageResult?.status === 'ready' ? imageResult.views : {},
    materials: blueprint.materials,
    sections: blueprint.sections.map((section) => ({
      title: section.name,
      status: section.status,
      estimated_time: section.estimatedTime,
      overview: section.description,
      diagram_url: sectionDiagrams[section.name] ?? null,
      layers: section.layers.map((layer) => ({
        title: layer.name,
        overview: layer.description,
        blocks: layer.materials?.reduce((total, material) => total + material.count, 0) ?? undefined
      }))
    }))
  };
}

export async function getBlueprintByProjectId(supabase: SupabaseClient, userId: string, projectId: string) {
  const { data, error } = await supabase
    .from('blueprints')
    .select('id, blueprint_data')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function saveConversationMessage({
  supabase,
  userId,
  conversationId,
  projectId,
  role,
  content,
  intent
}: {
  supabase: SupabaseClient;
  userId: string;
  conversationId: string;
  projectId?: string | null;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
}) {
  const { error } = await supabase.from('messages').insert({
    user_id: userId,
    conversation_id: conversationId,
    project_id: projectId ?? null,
    role,
    content,
    intent: intent ?? null
  });

  if (error) throw error;
}

export async function ensureConversation({
  supabase,
  userId,
  conversationId,
  projectId
}: {
  supabase: SupabaseClient;
  userId: string;
  conversationId?: string | null;
  projectId?: string | null;
}) {
  if (conversationId) {
    return conversationId;
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, project_id: projectId ?? null })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function saveGeneratedBlueprint({
  supabase,
  userId,
  prompt,
  blueprint,
  projectId,
  conversationId,
  existingBlueprintId,
  imageResult
}: {
  supabase: SupabaseClient;
  userId: string;
  prompt: string;
  blueprint: BlueprintResponse;
  projectId?: string | null;
  conversationId: string;
  existingBlueprintId?: string | null;
  imageResult?: GeneratedBlueprintImages | { status: 'failed'; error: string };
}) {
  console.log('[BlockBlueprint image] ✓ Saving blueprint image metadata', {
    status: imageResult?.status ?? 'pending',
    title: blueprint.title
  });
  const dashboardData = toDashboardBlueprintData(blueprint, imageResult);
  let resolvedProjectId = projectId ?? null;

  if (!resolvedProjectId) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: blueprint.title,
        status: 'generated'
      })
      .select('id')
      .single();

    if (projectError) throw projectError;
    resolvedProjectId = project.id as string;
  } else {
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ name: blueprint.title, status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', resolvedProjectId)
      .eq('user_id', userId);

    if (projectUpdateError) throw projectUpdateError;
  }

  const blueprintPayload = {
    user_id: userId,
    project_id: resolvedProjectId,
    prompt,
    name: blueprint.title,
    title: blueprint.title,
    description: blueprint.description,
    difficulty: blueprint.difficulty,
    estimated_time: blueprint.estimatedTime,
    estimated_blocks: blueprint.estimatedBlocks,
    dimensions: blueprint.dimensions,
    status: 'generated',
    blueprint_data: dashboardData,
    raw_blueprint: blueprint
  };

  const { data: savedBlueprint, error: blueprintError } = existingBlueprintId
    ? await supabase
        .from('blueprints')
        .update({ ...blueprintPayload, updated_at: new Date().toISOString() })
        .eq('id', existingBlueprintId)
        .eq('user_id', userId)
        .select('id, name, prompt, status, blueprint_data, created_at, updated_at, project_id')
        .single()
    : await supabase
        .from('blueprints')
        .insert(blueprintPayload)
        .select('id, name, prompt, status, blueprint_data, created_at, updated_at, project_id')
        .single();

  if (blueprintError) throw blueprintError;

  const { error: deleteSectionsError } = await supabase.from('blueprint_sections').delete().eq('blueprint_id', savedBlueprint.id);
  if (deleteSectionsError) throw deleteSectionsError;

  if (blueprint.sections.length) {
    const { error: sectionsError } = await supabase.from('blueprint_sections').insert(
      blueprint.sections.map((section, index) => ({
        user_id: userId,
        project_id: resolvedProjectId,
        blueprint_id: savedBlueprint.id,
        name: section.name,
        description: section.description,
        estimated_time: section.estimatedTime,
        status: section.status,
        sort_order: index,
        layers: section.layers
      }))
    );

    if (sectionsError) throw sectionsError;
  }

  const { error: conversationUpdateError } = await supabase
    .from('conversations')
    .update({ project_id: resolvedProjectId, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', userId);

  if (conversationUpdateError) throw conversationUpdateError;

  return {
    projectId: resolvedProjectId,
    blueprintId: savedBlueprint.id as string,
    dashboardBlueprint: savedBlueprint
  };
}

export async function updateBlueprintImages({
  supabase,
  userId,
  blueprintId,
  imageResult
}: {
  supabase: SupabaseClient;
  userId: string;
  blueprintId: string;
  imageResult: GeneratedBlueprintImages | { status: 'failed'; error: string };
}) {
  const { data: existing, error: readError } = await supabase
    .from('blueprints')
    .select('id, blueprint_data, raw_blueprint')
    .eq('id', blueprintId)
    .eq('user_id', userId)
    .single();

  if (readError) throw readError;

  const rawBlueprint = existing.raw_blueprint as BlueprintResponse | null;
  if (!rawBlueprint) {
    throw new Error('Saved blueprint is missing raw blueprint data.');
  }

  const blueprintData = toDashboardBlueprintData(rawBlueprint, imageResult);
  const { data, error } = await supabase
    .from('blueprints')
    .update({
      blueprint_data: blueprintData,
      updated_at: new Date().toISOString()
    })
    .eq('id', blueprintId)
    .eq('user_id', userId)
    .select('id, name, prompt, status, blueprint_data, created_at, updated_at, project_id')
    .single();

  if (error) throw error;

  console.log('[BlockBlueprint image] ✓ Image URL stored', {
    blueprintId,
    status: imageResult.status,
    hasPerspective: Boolean(blueprintData.preview_image_url)
  });

  return data;
}
