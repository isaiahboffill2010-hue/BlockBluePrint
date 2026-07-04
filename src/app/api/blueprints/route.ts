import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { generateBlueprint, type BlueprintContent } from '@/lib/claude';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function getUser(request: Request, supabaseAdmin: SupabaseClient): Promise<User | null> {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user;
}

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Blueprint storage is not configured yet.' }, { status: 503 });
  }

  const user = await getUser(request, supabaseAdmin);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to view your blueprints.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('blueprints')
    .select('id, project_id, name, prompt, status, blueprint_data, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Unable to load blueprints right now.' }, { status: 500 });
  }

  return NextResponse.json({ blueprints: data ?? [] });
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Blueprint storage is not configured yet.' }, { status: 503 });
  }

  const user = await getUser(request, supabaseAdmin);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to create blueprints.' }, { status: 401 });
  }

  let body: { prompt?: unknown };
  try {
    body = (await request.json()) as { prompt?: unknown };
  } catch {
    return NextResponse.json({ error: 'Please enter a blueprint prompt.' }, { status: 400 });
  }

  const prompt = String(body.prompt ?? '').trim();
  if (!prompt) {
    return NextResponse.json({ error: 'Please enter a blueprint prompt.' }, { status: 400 });
  }

  let blueprintData: BlueprintContent;
  try {
    blueprintData = await generateBlueprint(prompt);
  } catch (error) {
    console.error('Blueprint generation failed:', getErrorMessage(error, 'Unknown generation error'));
    return NextResponse.json({ error: 'Unable to generate your blueprint. Please try again.' }, { status: 502 });
  }

  const { data, error } = await supabaseAdmin
    .from('blueprints')
    .insert([
      {
        user_id: user.id,
        prompt,
        name: blueprintData.name ?? null,
        status: 'generated',
        blueprint_data: blueprintData
      }
    ])
    .select('id, project_id, name, prompt, status, blueprint_data, created_at, updated_at')
    .single();

  if (error) {
    console.error('Blueprint save failed:', error);
    return NextResponse.json({ error: 'Unable to save your blueprint right now.' }, { status: 500 });
  }

  return NextResponse.json({ blueprint: data });
}
