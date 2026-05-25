import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

function toUserInfo(me) {
  return {
    id: me.id,
    email: me.email,
    name: me.full_name,
    role: (me.role || "").toUpperCase(),
    ...(me.organisation_name ? { organisation_name: me.organisation_name } : {}),
    ...(me.contact_phone ? { contact_phone: me.contact_phone } : {}),
  };
}

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const meRes = await djangoFetch("/api/auth/me/", { token });
  if (!meRes.ok) {
    return NextResponse.json({ error: "Not authenticated." }, { status: meRes.status });
  }

  const me = await meRes.json();
  const userInfo = toUserInfo(me);
  const res = NextResponse.json({ user: userInfo });
  res.cookies.set("user_info", encodeURIComponent(JSON.stringify(userInfo)), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
