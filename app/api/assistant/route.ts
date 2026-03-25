import { NextResponse } from 'next/server';
import { askAssistant } from '@/lib/assistant';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { prompt } = await req.json();
  const response = await askAssistant(prompt, user?.id);
  return NextResponse.json({ response, provider: 'mock-assistant-provider' });
}
