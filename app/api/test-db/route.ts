import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({
      success: true,
      state: mongoose.connection.readyState,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host
    });
  } catch (error: any) {
    console.error('TEST DB ERROR:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Database connection failed' }, { status: 500 });
  }
}
