import { NextResponse } from "next/server";
import { djangoFetch } from "@/lib/djangoApi";

const TOKEN_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export async function POST(req) {
  const { email, password } = await req.json();

  const loginRes = await djangoFetch("/api/auth/login/", {
    method: "POST",
    body: { email, password },
  });

  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}));
    const message =
      err?.non_field_errors?.[0] ||
      err?.detail ||
      "Invalid email or password.";
    return NextResponse.json({ error: message }, { status: loginRes.status });
  }

  const { access, refresh } = await loginRes.json();

  // Fetch the user's own profile using the new /api/auth/me/ endpoint
  const meRes = await djangoFetch("/api/auth/me/", { token: access });
  let userInfo = { email };
  if (meRes.ok) {
    const me = await meRes.json();
    userInfo = { id: me.id, email: me.email, name: me.full_name, role: me.role };
  }

  const res = NextResponse.json({ ok: true, user: userInfo });

  res.cookies.set("access_token", access, { ...TOKEN_OPTS, maxAge: 60 * 60 });
  res.cookies.set("refresh_token", refresh, { ...TOKEN_OPTS, maxAge: 7 * 24 * 60 * 60 });
  // user_info is NOT httpOnly so client JS can read it for role/name display
  res.cookies.set("user_info", encodeURIComponent(JSON.stringify(userInfo)), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return res;
}
