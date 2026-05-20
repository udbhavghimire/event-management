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

  const loginData = await loginRes.json();
  const { access, refresh } = loginData;

  // Build userInfo from the login response if available (updated backend)
  // or fall back to calling /api/auth/me/ (works with both old and new backend)
  let userInfo = { email };

  if (loginData.user) {
    const u = loginData.user;
    userInfo = {
      id: u.id,
      email: u.email,
      name: u.full_name,
      role: u.role,
      ...(u.organisation_name ? { organisation_name: u.organisation_name } : {}),
    };
  } else {
    // Fallback: fetch profile from /api/auth/me/ endpoint
    const meRes = await djangoFetch("/api/auth/me/", { token: access });
    if (meRes.ok) {
      const me = await meRes.json();
      userInfo = {
        id: me.id,
        email: me.email,
        name: me.full_name,
        role: me.role,
        ...(me.organisation_name ? { organisation_name: me.organisation_name } : {}),
      };
    }
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
