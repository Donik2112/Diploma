import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import StudentProfile from '@/models/StudentProfile';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

function getProfileCompletionHints(profile: any) {
  const missing: string[] = [];
  if (!profile?.skills?.length) missing.push('skills');
  if (!profile?.city) missing.push('city');
  if (!profile?.experienceLevel) missing.push('experienceLevel');
  if (!profile?.interests?.length) missing.push('interests');
  return missing;
}

function normalizeRecommendations(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.recommendations)) return raw.recommendations;
  if (Array.isArray(raw?.[0])) return raw[0];
  return [];
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ML_API_URL = process.env.ML_API_URL;
    console.log('ML_API_URL =', ML_API_URL || 'undefined');
    console.log('Using fallback demo engine: disabled');
    if (!ML_API_URL) {
      return NextResponse.json({ error: 'ML_API_URL is not configured' }, { status: 500 });
    }

    const authUser = getUserFromCookie();
    let profile: any = null;
    if (authUser?.role === 'STUDENT') {
      await dbConnect();
      profile = await StudentProfile.findOne({ userId: authUser.userId }).lean();
    }

    const payload = {
      skills: body.skills || toStringList(profile?.skills).join(', '),
      experience: body.experience || profile?.experienceLevel || 'JUNIOR',
      employment: body.employment || '',
      city: body.city || profile?.city || '',
      interests: body.interests || toStringList(profile?.interests).join(', '),
      top_n: body.top_n || 10,
      strict_city: body.strict_city || false
    };

    const missing = getProfileCompletionHints(profile);
    console.log('Calling HF model...');
    const startRes = await fetch(`${ML_API_URL}/gradio_api/call/gradio_recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          payload.skills,
          payload.experience,
          payload.employment,
          payload.city,
          payload.interests,
          payload.top_n,
          payload.strict_city
        ]
      }),
      cache: 'no-store'
    });
    const startData = await startRes.json();
    if (!startRes.ok) {
      return NextResponse.json(
        { error: 'Failed to start ML request', details: startData },
        { status: startRes.status }
      );
    }

    const eventId = startData.event_id;
    if (!eventId) {
      return NextResponse.json({ error: 'No event_id returned from Gradio', details: startData }, { status: 500 });
    }

    const resultUrl = `${ML_API_URL}/gradio_api/call/gradio_recommend/${eventId}`;
    for (let i = 0; i < 20; i++) {
      await sleep(1500);
      const resultRes = await fetch(resultUrl, { method: 'GET', cache: 'no-store' });
      const text = await resultRes.text();

      if (text.includes('"msg":"process_completed"') || text.includes('"msg": "process_completed"')) {
        const lines = text.trim().split('\n');
        const lastJsonLine = [...lines].reverse().find((line) => line.startsWith('data: '));
        if (!lastJsonLine) {
          return NextResponse.json({ error: 'Could not parse completed response', raw: text }, { status: 500 });
        }
        const parsed = JSON.parse(lastJsonLine.replace(/^data:\s*/, ''));
        const normalized = normalizeRecommendations(parsed);
        return NextResponse.json({
          success: true,
          source: 'ML API',
          warnings: missing.length ? [`Profile is incomplete: missing ${missing.join(', ')}`] : [],
          data: { recommendations: normalized, source: 'ML API', warnings: missing },
          recommendations: normalized
        });
      }
    }

    return NextResponse.json({ error: 'ML request timed out' }, { status: 504 });
  } catch (error) {
    console.error('Recommend route error:', error);
    return NextResponse.json(
      { error: 'ML request failed', details: String(error) },
      { status: 500 }
    );
  }
}
