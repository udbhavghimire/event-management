import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const res = await djangoFetch(`/api/registrations/${id}/refund/reject/`, {
      method: "POST",
      token,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail || "Could not reject refund." },
        { status: res.status }
      );
    }
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    console.error("[refund reject POST] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
