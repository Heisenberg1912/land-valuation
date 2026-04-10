import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { isLocalDevBypass } from "./dev";
import { getMockStore, type MockUser, type MockUsageRow } from "./mock-store";
import { dbConnect } from "./mongo";
import { Session, Usage, User } from "./models";
import { isValidAccessCode } from "./access-codes";

const COOKIE = "va_session";

// TypeScript interfaces for User document
export interface UserDocument {
  _id: string;
  email: string;
  password?: string;
  name: string;
  role: "user" | "associate" | "vendor" | "buyer" | "admin" | "superadmin";
  isVerified: boolean;
  isActive: boolean;
  subscription: {
    plan: "free" | "pro" | "enterprise";
    status: "active" | "canceled" | "expired";
    startDate: Date;
    endDate?: Date;
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

function toUserDocument(user: MockUser): UserDocument {
  return {
    ...user,
    subscription: { ...user.subscription }
  };
}

export function sanitizeUser(user: UserDocument): Omit<UserDocument, "password"> {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function getAuthEmail(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  if (isLocalDevBypass()) {
    return getMockStore().sessions.get(token) ?? null;
  }
  await dbConnect();
  const sess = await Session.findOne({ token }).lean<{ email: string }>();
  return sess?.email ?? null;
}

export async function getAuthUser(): Promise<UserDocument | null> {
  const email = await getAuthEmail();
  if (!email) return null;
  if (isLocalDevBypass()) {
    const user = getMockStore().users.get(email.toLowerCase());
    return user?.isActive ? toUserDocument(user) : null;
  }
  await dbConnect();
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).lean<UserDocument>();
  return user;
}

export async function getUserByEmail(email: string): Promise<UserDocument | null> {
  if (isLocalDevBypass()) {
    const user = getMockStore().users.get(email.toLowerCase());
    return user ? toUserDocument(user) : null;
  }
  await dbConnect();
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password").lean<UserDocument>();
  return user;
}

export async function createUser(email: string, password: string, name: string) {
  if (isLocalDevBypass()) {
    const store = getMockStore();
    const now = new Date();
    const lowerEmail = email.toLowerCase();
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user: MockUser = {
      _id: crypto.randomBytes(12).toString("hex"),
      email: lowerEmail,
      password: hashedPassword,
      name,
      role: "user",
      isVerified: true,
      isActive: true,
      subscription: {
        plan: "free",
        status: "active",
        startDate: now
      },
      createdAt: now,
      updatedAt: now
    };
    store.users.set(lowerEmail, user);
    return sanitizeUser(toUserDocument(user));
  }
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

export async function createSession(email: string) {
  const token = newToken();
  if (isLocalDevBypass()) {
    getMockStore().sessions.set(token, email.toLowerCase());
    return token;
  }
  await dbConnect();
  await Session.create({ token, email: email.toLowerCase() });
  return token;
}

export async function clearSession(token: string) {
  if (!token) return;
  if (isLocalDevBypass()) {
    getMockStore().sessions.delete(token);
    return;
  }
  await dbConnect();
  await Session.deleteOne({ token });
}

export async function touchLastLogin(email: string) {
  const lowerEmail = email.toLowerCase();
  if (isLocalDevBypass()) {
    const user = getMockStore().users.get(lowerEmail);
    if (user) {
      user.lastLogin = new Date();
      user.updatedAt = new Date();
    }
    return;
  }
  await dbConnect();
  await User.findOneAndUpdate({ email: lowerEmail }, { lastLogin: new Date() });
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

type UsageRow = MockUsageRow;

export async function getUsageState(key: string) {
  if (isLocalDevBypass()) {
    const store = getMockStore();
    const row = store.usage.get(key) ?? { key, freeUsed: 0, paid: false };
    store.usage.set(key, row);
    return { ...row };
  }
  await dbConnect();
  const row = await Usage.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, freeUsed: 0, paid: false } },
    { upsert: true, new: true }
  ).lean<UsageRow>();
  return row ?? { key, freeUsed: 0, paid: false };
}

export async function incrementFreeUse(key: string) {
  if (isLocalDevBypass()) {
    const store = getMockStore();
    const row = store.usage.get(key) ?? { key, freeUsed: 0, paid: false };
    const next = { ...row, freeUsed: row.freeUsed + 1 };
    store.usage.set(key, next);
    return next;
  }
  await dbConnect();
  const row = await Usage.findOneAndUpdate({ key }, { $inc: { freeUsed: 1 } }, { new: true }).lean<UsageRow>();
  return row ?? { key, freeUsed: 0, paid: false };
}

export async function checkHasPro(accessCode?: string | null): Promise<boolean> {
  // Check access code first
  if (isValidAccessCode(accessCode)) {
    return true;
  }

  if (isLocalDevBypass()) {
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
