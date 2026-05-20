import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformTier } from "@/lib/djangoApi";

export async function GET(req, { params }) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  const eventRes = await djangoFetch(`/api/events/${id}/`, { token });
  if (!eventRes.ok) return NextResponse.json([], { status: eventRes.status });
  const event = await eventRes.json();
  return NextResponse.json((event.ticket_tiers || []).map(transformTier));
}

export async function POST(req, { params }) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  const body = await req.json();

  const djangoBody = {
    tier_name: body.name,
    price: body.price,
    quantity_total: body.quantity,
  };

  const res = await djangoFetch(`/api/events/${id}/tiers/`, { method: "POST", body: djangoBody, token });
  const data = await res.json();

  if (!res.ok) {
    const msg = Object.values(data)?.[0];
    return NextResponse.json({ error: Array.isArray(msg) ? msg[0] : data?.detail || "Failed to add tier." }, { status: res.status });
  }

  return NextResponse.json(transformTier(data), { status: 201 });
}
