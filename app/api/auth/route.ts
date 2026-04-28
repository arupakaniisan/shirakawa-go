export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { passphrase } = await req.json();

  if (passphrase !== process.env.PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setAuthCookie(res);
  return res;
}
