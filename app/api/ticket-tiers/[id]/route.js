import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformTier } from "@/lib/djangoApi";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const body = await req.json();

    const djangoBody = {};
    if (body.name !== undefined) djangoBody.tier_name = body.name;
    if (body.price !== undefined) djangoBody.price = body.price;
    if (body.quantity !== undefined) djangoBody.quantity_total = body.quantity;

    const res = await djangoFetch(`/api/tiers/${id}/`, { method: "PATCH", body: djangoBody, token });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.detail || "Update failed." }, { status: res.status });
    return NextResponse.json(transformTier(data));
  } catch (err) {
    console.error("[tier PUT] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const res = await djangoFetch(`/api/tiers/${id}/`, { method: "DELETE", token });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data?.detail || "Delete failed." }, { status: res.status });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[tier DELETE] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
