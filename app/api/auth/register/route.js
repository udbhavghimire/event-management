import { NextResponse } from "next/server";
import { djangoFetch } from "@/lib/djangoApi";

const TOKEN_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export async function POST(req) {
  const body = await req.json();
  // body: { full_name, email, password, role, organisation_name? }

  const djangoRes = await djangoFetch("/api/auth/register/", {
    method: "POST",
    body,
  });

  if (!djangoRes.ok) {
    const err = await djangoRes.json().catch(() => ({}));
    const first = Object.values(err)?.[0];
    const message = Array.isArray(first) ? first[0] : err?.detail || "Registration failed.";
    return NextResponse.json({ error: message }, { status: djangoRes.status });
  }

  const { user_id, access, refresh } = await djangoRes.json();
  const userInfo = {
    id: user_id,
    email: body.email,
    name: body.full_name,
    role: body.role,
    ...(body.organisation_name ? { organisation_name: body.organisation_name } : {}),
  };

  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", access, { ...TOKEN_OPTS, maxAge: 60 * 60 });
  res.cookies.set("refresh_token", refresh, { ...TOKEN_OPTS, maxAge: 7 * 24 * 60 * 60 });
  res.cookies.set("user_info", encodeURIComponent(JSON.stringify(userInfo)), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return res;
}
