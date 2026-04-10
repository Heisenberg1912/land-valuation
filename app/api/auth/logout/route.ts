import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSession } from "@/lib/auth";

export async function POST() {
  const token = cookies().get("va_session")?.value;
  cookies().set("va_session", "", { path: "/", maxAge: 0 });
  if (token) {
    await clearSession(token);
  }
  return NextResponse.json({ ok: true });
}
