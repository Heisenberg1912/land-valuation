import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/mongo";
import { Session } from "@/lib/models";

export async function POST() {
  const token = cookies().get("va_session")?.value;
  cookies().set("va_session", "", { path: "/", maxAge: 0 });
  if (token) {
    await dbConnect();
    await Session.deleteOne({ token });
  }
  return NextResponse.json({ ok: true });
}
