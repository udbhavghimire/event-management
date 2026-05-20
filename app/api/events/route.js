import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformEvent, transformEventList } from "@/lib/djangoApi";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "asc";
  const mine = searchParams.get("mine") === "true";

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (!mine) params.set("ordering", sort === "desc" ? "-start_time" : "start_time");
  if (mine) params.set("mine", "true");

  const res = await djangoFetch(`/api/events/?${params}`, {
    token: getTokenFromRequest(req),
  });

  if (!res.ok) return NextResponse.json([], { status: res.status });

  const data = await res.json();
  const results = Array.isArray(data) ? data : data.results ?? [];
  return NextResponse.json(results.map(mine ? transformEvent : transformEventList));
}

export async function POST(req) {
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

  return NextResponse.json({ id: data.id, ...data }, { status: 201 });
}
