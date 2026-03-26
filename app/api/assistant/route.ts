import { NextResponse } from 'next/server';
import { assistantReply } from '@/lib/assistant';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  return NextResponse.json({ reply: assistantReply(prompt || '') });
}
