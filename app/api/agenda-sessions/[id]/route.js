import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const res = await djangoFetch(`/api/sessions/${id}/`, { method: "DELETE", token });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data?.detail || "Delete failed." }, { status: res.status });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[agenda-session DELETE] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
