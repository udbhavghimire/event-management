import { NextResponse } from "next/server";
import { djangoFetch } from "@/lib/djangoApi";

export async function POST(req) {
  try {
    const body = await req.json();

    let djangoRes;
    try {
      djangoRes = await djangoFetch("/api/auth/register/", {
        method: "POST",
        body,
      });
    } catch (fetchErr) {
      console.error("[register] djangoFetch failed:", fetchErr);
      return NextResponse.json(
        { error: "Cannot reach the API server. Check DJANGO_API_URL." },
        { status: 503 }
      );
    }

    if (!djangoRes.ok) {
      const err = await djangoRes.json().catch(() => ({}));
      const first = Object.values(err)?.[0];
      const message = Array.isArray(first) ? first[0] : err?.detail || "Registration failed.";
      return NextResponse.json({ error: message }, { status: djangoRes.status });
    }

    // Intentionally do NOT set auth cookies here — the user must sign in
    // explicitly after registration so the full login flow runs correctly.
    await djangoRes.json(); // consume body
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
