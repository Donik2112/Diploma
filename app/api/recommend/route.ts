import { NextRequest, NextResponse } from 'next/server';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mlApiUrl = process.env.ML_API_URL;
    if (!mlApiUrl) {
      return NextResponse.json(
        { error: 'ML_API_URL is not configured' },
        { status: 500 }
      );
    }

    const startRes = await fetch(`${mlApiUrl}/gradio_api/call/gradio_recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [
          body.skills || '',
          body.experience || '',
          body.employment || '',
          body.city || '',
          body.interests || '',
          body.top_n || 10,
          body.strict_city || false
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
      return NextResponse.json(
        { error: 'No event_id returned from Gradio', details: startData },
        { status: 500 }
      );
    }

    const resultUrl = `${mlApiUrl}/gradio_api/call/gradio_recommend/${eventId}`;

    for (let i = 0; i < 20; i++) {
      await sleep(1500);

      const resultRes = await fetch(resultUrl, {
        method: 'GET',
        cache: 'no-store'
      });

      const text = await resultRes.text();

      if (text.includes('"msg":"process_completed"') || text.includes('"msg": "process_completed"')) {
        const lines = text.trim().split('\n');
        const lastJsonLine = [...lines].reverse().find((line) => line.startsWith('data: '));
        if (!lastJsonLine) {
          return NextResponse.json(
            { error: 'Could not parse completed response', raw: text },
            { status: 500 }
          );
        }

        const parsed = JSON.parse(lastJsonLine.replace(/^data:\s*/, ''));
        return NextResponse.json({
          success: true,
          data: { recommendations: parsed },
          recommendations: parsed
        });
      }
    }

    return NextResponse.json(
      { error: 'ML request timed out' },
      { status: 504 }
    );
  } catch (error) {
    console.error('Recommend API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
