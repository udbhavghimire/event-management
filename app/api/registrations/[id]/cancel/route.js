import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformMyRegistration } from "@/lib/djangoApi";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const res = await djangoFetch(`/api/registrations/${id}/cancel/`, { method: "POST", token });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail || "Could not cancel registration." },
        { status: res.status }
      );
    }
    return NextResponse.json({ ok: true, registration: transformMyRegistration(data) });
  } catch (err) {
    console.error("[registrations cancel POST] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
