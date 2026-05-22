import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const res = await djangoFetch(`/api/registrations/${id}/refund/`, {
      method: "POST",
      token,
      body: { reason: body.reason || "" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail || "Refund request failed." },
        { status: res.status }
      );
    }
    return NextResponse.json({ ok: true, refund: data });
  } catch (err) {
    console.error("[registrations refund POST] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
