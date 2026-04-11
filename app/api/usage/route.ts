import { NextResponse } from "next/server";
import { ensureUsageKey, getUsageState, getAuthUser, checkHasPro } from "@/lib/auth";

export async function GET(req: Request) {
  // Check for access code in header
  const accessCode = req.headers.get("x-vitruvi-access-code");

  try {
    // Get user info
    const user = await getAuthUser();

    // Check if user has Pro
    const hasPro = await checkHasPro(accessCode);

    // Get usage state
    const { key } = await ensureUsageKey();
    const state = await getUsageState(key);
    const freeRemaining = (state.paid || hasPro) ? Infinity : Math.max(0, 3 - state.freeUsed);

    // Return comprehensive usage info
    return NextResponse.json({
      freeUsed: hasPro ? 0 : state.freeUsed,
      freeRemaining,
      paid: state.paid || hasPro,
      hasPro,
      user: user ? {
        name: user.name,
        email: user.email,
        subscription: user.subscription
      } : null
    });
  } catch {
    // MongoDB not configured — return unlimited access for local development
    return NextResponse.json({
      freeUsed: 0,
      freeRemaining: Infinity,
      paid: true,
      hasPro: true,
      user: null
    });
  }
}
