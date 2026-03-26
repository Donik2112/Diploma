import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb+srv://madi:madi@cluster0.avoaf.mongodb.net/diploma';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached = global.mongooseCache || { conn: null, promise: null };
global.mongooseCache = cached;

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((conn) => {
      console.log('Connected to MongoDB:', conn.connection.host);
      return conn;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
