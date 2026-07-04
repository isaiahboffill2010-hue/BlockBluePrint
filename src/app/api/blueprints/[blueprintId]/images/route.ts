import { NextResponse } from 'next/server';
import { generateBlueprintImages } from '@/lib/ai/image-service';
import { updateBlueprintImages } from '@/lib/server/blueprint-persistence';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/server/supabase-admin';

export async function POST(request: Request, { params }: { params: Promise<{ blueprintId: string }> }) {
  const { blueprintId } = await params;
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Blueprint storage is not configured yet.' }, { status: 503 });
  }

  const user = await getAuthenticatedUser(request, supabaseAdmin);
  if (!user) {
    return NextResponse.json({ message: 'Please sign in to retry image generation.' }, { status: 401 });
  }

  try {
    console.log('[BlockBlueprint image] ✓ Retry requested', { blueprintId });
    const { data: blueprint, error } = await supabaseAdmin
      .from('blueprints')
      .select('raw_blueprint')
      .eq('id', blueprintId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    if (!blueprint?.raw_blueprint) {
      return NextResponse.json({ message: 'This blueprint cannot be retried because its source data is missing.' }, { status: 400 });
    }

    const imageResult = await generateBlueprintImages(blueprint.raw_blueprint);
    const updated = await updateBlueprintImages({
      supabase: supabaseAdmin,
      userId: user.id,
      blueprintId,
      imageResult
    });

    return NextResponse.json({ blueprint: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed.';
    console.error('[BlockBlueprint image] Retry failed:', error);

    try {
      await updateBlueprintImages({
        supabase: supabaseAdmin,
        userId: user.id,
        blueprintId,
        imageResult: { status: 'failed', error: message }
      });
    } catch (saveError) {
      console.error('[BlockBlueprint image] Failed to save retry error:', saveError);
    }

    return NextResponse.json({ message }, { status: 502 });
  }
}
