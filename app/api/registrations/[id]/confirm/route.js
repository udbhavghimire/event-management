import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const body = await req.json();

    const res = await djangoFetch(`/api/registrations/${id}/confirm/`, {
      method: "POST",
      body: { intent_id: body.intentId || body.intent_id },
      token,
    });
    const data = await res.json();

    if (!res.ok) {
      const detail = data?.detail || data?.error || "Payment confirmation failed.";
      return NextResponse.json({ error: detail }, { status: res.status });
    }

    return NextResponse.json({ ok: true, registration: data });
  } catch (err) {
    console.error("[registrations confirm POST] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
