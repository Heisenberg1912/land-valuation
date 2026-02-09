import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { dbConnect } from "@/lib/mongo";
import { Session, User } from "@/lib/models";
import { newToken, createUser } from "@/lib/auth";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100)
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const user = await createUser(body.email, body.password, body.name);

    // Create session
    const token = newToken();
    await Session.create({ token, email: body.email.toLowerCase() });

    cookies().set("va_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return NextResponse.json({
      ok: true,
      user
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input. Email, password (min 6 chars), and name are required." },
        { status: 400 }
      );
    }
    console.error("[Register] Error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
