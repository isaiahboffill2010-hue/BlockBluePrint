import { NextResponse } from 'next/server';
import { generateBlueprint } from '@/lib/claude';

export async function POST(request: Request) {
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

  try {
    const blueprint = await generateBlueprint(prompt);
    return NextResponse.json({ blueprint });
  } catch (error) {
    console.error('Blueprint generation failed:', error);
    return NextResponse.json({ error: 'Unable to generate your blueprint. Please try again.' }, { status: 502 });
  }
}
