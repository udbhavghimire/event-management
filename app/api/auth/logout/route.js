import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (token) {
    await djangoFetch("/api/auth/logout/", { method: "POST", token }).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", "", { httpOnly: true, maxAge: 0, path: "/" });
  res.cookies.set("refresh_token", "", { httpOnly: true, maxAge: 0, path: "/" });
  res.cookies.set("user_info", "", { httpOnly: false, maxAge: 0, path: "/" });
  return res;
}
