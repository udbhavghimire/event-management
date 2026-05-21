import { NextResponse } from "next/server";
import { djangoFetch } from "@/lib/djangoApi";

const TOKEN_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    let loginRes;
    try {
      loginRes = await djangoFetch("/api/auth/login/", {
        method: "POST",
        body: { email, password },
      });
    } catch (fetchErr) {
      console.error("[login] djangoFetch failed:", fetchErr);
      return NextResponse.json(
        { error: "Cannot reach the API server. Check DJANGO_API_URL." },
        { status: 503 }
      );
    }

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

    // Build userInfo — prefer user object in login response, fall back to /me/
    let userInfo = { email };

    if (loginData.user) {
      const u = loginData.user;
      userInfo = {
        id: u.id,
        email: u.email,
        name: u.full_name,
        // Normalize role to uppercase so client checks are consistent
        role: (u.role || "").toUpperCase(),
        ...(u.organisation_name ? { organisation_name: u.organisation_name } : {}),
      };
    } else {
      try {
        const meRes = await djangoFetch("/api/auth/me/", { token: access });
        if (meRes.ok) {
          const me = await meRes.json();
          userInfo = {
            id: me.id,
            email: me.email,
            name: me.full_name,
            role: (me.role || "").toUpperCase(),
            ...(me.organisation_name ? { organisation_name: me.organisation_name } : {}),
          };
        }
      } catch {
        // me/ is optional — proceed with email-only info
      }
    }

    const res = NextResponse.json({ ok: true, user: userInfo });
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
  } catch (err) {
    console.error("[login] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
