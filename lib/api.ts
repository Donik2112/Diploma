import { NextResponse } from 'next/server';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { message, details } }, { status });
}

export async function handleApi(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (error: any) {
    if (error instanceof ApiError) return fail(error.message, error.status);
    return fail('Internal server error', 500, process.env.NODE_ENV === 'development' ? error?.message : undefined);
  }
}
