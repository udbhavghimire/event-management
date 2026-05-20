import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformEvent } from "@/lib/djangoApi";

export async function GET(req, { params }) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  const res = await djangoFetch(`/api/events/${id}/`, { token });

  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: res.status });

  const data = await res.json();
  return NextResponse.json(transformEvent(data));
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  const body = await req.json();

  // Handle publish/unpublish/cancel actions
  if ("published" in body || "status" in body) {
    const target = body.status ?? (body.published ? "PUBLISHED" : "CANCELLED");
    let action;
    if (target === "PUBLISHED") action = "publish";
    else if (target === "DRAFT") action = "unpublish";
    else action = "cancel";
    const res = await djangoFetch(`/api/events/${id}/${action}/`, { method: "POST", token });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.detail || "Action failed." }, { status: res.status });
    return NextResponse.json(data);
  }

  // Regular update (PATCH)
  const djangoBody = {};
  if (body.title !== undefined) djangoBody.title = body.title;
  if (body.description !== undefined) djangoBody.description = body.description;
  if (body.startTime !== undefined) djangoBody.start_time = body.startTime;
  if (body.endTime !== undefined) djangoBody.end_time = body.endTime;
  if (body.venue !== undefined) djangoBody.venue = body.venue;
  if (body.capacity !== undefined) djangoBody.capacity = body.capacity;

  const res = await djangoFetch(`/api/events/${id}/`, { method: "PATCH", body: djangoBody, token });
  const data = await res.json();
  if (!res.ok) {
    const msg = Object.values(data)?.[0];
    return NextResponse.json({ error: Array.isArray(msg) ? msg[0] : data?.detail || "Update failed." }, { status: res.status });
  }
  return NextResponse.json(transformEvent(data));
}

export async function PATCH(req, { params }) {
  return PUT(req, { params });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  // Django has no DELETE; cancel the event instead
  const res = await djangoFetch(`/api/events/${id}/cancel/`, { method: "POST", token });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ error: data?.detail || "Cancel failed." }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
