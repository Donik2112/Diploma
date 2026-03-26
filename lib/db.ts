import mongoose from 'mongoose';

let cached = (global as any).mongoose;
if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }
  return uri;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = getMongoUri();
    cached.promise = mongoose.connect(uri, { dbName: 'diploma-platform' });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
