// lib/db.ts
import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global caching interface to preserve connection states across hot-reloads
interface GlobalMongoConnection {
  conn: { client: MongoClient; db: Db } | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
  var mongoCache: GlobalMongoConnection | undefined;
}

let cached = global.mongoCache;

if (!cached) {
  cached = global.mongoCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {};
    cached!.promise = MongoClient.connect(MONGODB_URI!, opts).then((client) => {
      return {
        client,
        db: client.db(), // Uses the database specified in the connection string
      };
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}