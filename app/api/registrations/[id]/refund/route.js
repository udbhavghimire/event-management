import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function POST(req, { params }) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  // Django only supports cancel (no organizer-initiated refund endpoint)
  const res = await djangoFetch(`/api/registrations/${id}/cancel/`, { method: "POST", token });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ error: data?.detail || "Cancel failed." }, { status: res.status });
  return NextResponse.json({ ok: true });
}
