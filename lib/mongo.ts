import mongoose from "mongoose";
import { isLocalDevBypass } from "./dev";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached = global.__mongooseConn ?? { conn: null, promise: null };
global.__mongooseConn = cached;

export async function dbConnect() {
  if (isLocalDevBypass()) return mongoose;
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) throw new Error("Missing env var: MONGODB_URI");
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
