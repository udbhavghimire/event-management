import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const body = await req.json();

    if ("suspended" in body) {
      if (body.suspended) {
        const res = await djangoFetch(`/api/admin/users/${id}/suspend/`, { method: "POST", token });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return NextResponse.json({ error: data?.detail || "Action failed." }, { status: res.status });
        return NextResponse.json({ ok: true, detail: data.detail });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Role change not supported by the backend." }, { status: 501 });
  } catch (err) {
    console.error("[admin user PUT] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const res = await djangoFetch(`/api/admin/users/`, { token });
    if (!res.ok) return NextResponse.json({ error: "Not found." }, { status: res.status });
    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results ?? [];
    const user = results.find((u) => String(u.id) === String(id));
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    console.error("[admin user GET] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
