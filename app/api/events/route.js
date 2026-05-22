import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformEventList } from "@/lib/djangoApi";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "desc";
    const mine = searchParams.get("mine") === "true";

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    // asc = soonest upcoming (start_time), desc = newest first (created_at descending)
    if (!mine) {
      params.set("ordering", sort === "desc" ? "-created_at" : "start_time");
    }
    if (mine) params.set("mine", "true");

    const res = await djangoFetch(`/api/events/?${params}`, {
      token: getTokenFromRequest(req),
    });

    if (!res.ok) return NextResponse.json([], { status: res.status });

    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results ?? [];
    return NextResponse.json(results.map(transformEventList));
  } catch (err) {
    console.error("[events GET] error:", err);
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req) {
  try {
    const token = getTokenFromRequest(req);
    const body = await req.json();

    const djangoBody = {
      title: body.title,
      description: body.description,
      start_time: body.startTime,
      end_time: body.endTime,
      venue: body.venue,
      capacity: body.capacity,
    };

    const res = await djangoFetch("/api/events/", { method: "POST", body: djangoBody, token });
    const data = await res.json();

    if (!res.ok) {
      const msg = Object.values(data)?.[0];
      return NextResponse.json(
        { error: Array.isArray(msg) ? msg[0] : data?.detail || "Failed to create event." },
        { status: res.status }
      );
    }

    // Auto-publish the newly created event so it appears in the organiser's
    // dashboard immediately. (Django's list endpoint only returns PUBLISHED events,
    // even for mine=true.) The organiser can unpublish from the dashboard later.
    try {
      await djangoFetch(`/api/events/${data.id}/publish/`, { method: "POST", token });
    } catch {
      // Non-fatal — event is created, just not yet visible in lists
    }

    return NextResponse.json({ id: data.id, ...data }, { status: 201 });
  } catch (err) {
    console.error("[events POST] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
