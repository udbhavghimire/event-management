import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformSession } from "@/lib/djangoApi";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const eventRes = await djangoFetch(`/api/events/${id}/`, { token });
    if (!eventRes.ok) return NextResponse.json([], { status: eventRes.status });
    const event = await eventRes.json();
    return NextResponse.json((event.sessions || []).map(transformSession));
  } catch (err) {
    console.error("[agenda GET] error:", err);
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const body = await req.json();

    const djangoBody = {
      title: body.title,
      speaker: body.speaker,
      start_time: body.startTime,
      duration_minutes: body.duration,
    };

    const res = await djangoFetch(`/api/events/${id}/sessions/`, { method: "POST", body: djangoBody, token });
    const data = await res.json();

    if (!res.ok) {
      const msg = Object.values(data)?.[0];
      return NextResponse.json({ error: Array.isArray(msg) ? msg[0] : data?.detail || "Failed to add session." }, { status: res.status });
    }

    return NextResponse.json(transformSession(data), { status: 201 });
  } catch (err) {
    console.error("[agenda POST] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
