// Cookie ユーティリティ
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "is_authed";
const SEVEN_DAYS_SEC = 60 * 60 * 24 * 7;

export function setAuthCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, process.env.AUTH_TOKEN!, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: SEVEN_DAYS_SEC,
    path: "/",
  });
}

export function verifyAuthCookie(req: NextRequest): boolean {
  const value = req.cookies.get(COOKIE_NAME)?.value;
  return !!value && value === process.env.AUTH_TOKEN;
}
