import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { dbConnect } from "@/lib/mongo";
import { Session, User } from "@/lib/models";
import { newToken, getUserByEmail, verifyPassword } from "@/lib/auth";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());

    await dbConnect();

    // Find user with password field
    const user = await getUserByEmail(body.email);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is not active" },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(body.password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Create session
    const token = newToken();
    await Session.create({ token, email: body.email.toLowerCase() });

    cookies().set("va_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      ok: true,
      user: userWithoutPassword
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid email or password format" },
        { status: 400 }
      );
    }
    console.error("[Login] Error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
