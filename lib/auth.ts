import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { dbConnect } from "./mongo";
import { Session, Usage, User } from "./models";
import { isValidAccessCode } from "./access-codes";

const COOKIE = "va_session";

export async function getAuthEmail(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  await dbConnect();
  const sess = await Session.findOne({ token }).lean<{ email: string }>();
  return sess?.email ?? null;
}

export async function getAuthUser() {
  const email = await getAuthEmail();
  if (!email) return null;
  await dbConnect();
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).lean();
  return user;
}

export async function getUserByEmail(email: string) {
  await dbConnect();
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password").lean();
  return user;
}

export async function createUser(email: string, password: string, name: string) {
  await dbConnect();
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    name,
    role: "user",
    isVerified: true,
    isActive: true,
  });
  return user.toJSON();
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function newToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function ensureUsageKey(): Promise<{ key: string; email: string | null }> {
  const email = await getAuthEmail();
  if (email) return { key: email, email };

  const jar = cookies();
  let device = jar.get("va_device")?.value;
  if (!device) {
    device = crypto.randomBytes(16).toString("hex");
    jar.set("va_device", device, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return { key: `device:${device}`, email: null };
}

type UsageRow = { key: string; freeUsed: number; paid: boolean };

export async function getUsageState(key: string) {
  await dbConnect();
  const row = await Usage.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, freeUsed: 0, paid: false } },
    { upsert: true, new: true }
  ).lean<UsageRow>();
  return row ?? { key, freeUsed: 0, paid: false };
}

export async function incrementFreeUse(key: string) {
  await dbConnect();
  const row = await Usage.findOneAndUpdate({ key }, { $inc: { freeUsed: 1 } }, { new: true }).lean<UsageRow>();
  return row ?? { key, freeUsed: 0, paid: false };
}

export async function checkHasPro(accessCode?: string | null): Promise<boolean> {
  // Check access code first
  if (isValidAccessCode(accessCode)) {
    return true;
  }

  // Check user subscription
  const user = await getAuthUser();
  if (!user?.subscription) return false;

  const isPro = user.subscription.plan === "pro";
  const isActive = user.subscription.status === "active";
  const notExpired = !user.subscription.endDate || new Date(user.subscription.endDate) > new Date();

  return isPro && isActive && notExpired;
}
