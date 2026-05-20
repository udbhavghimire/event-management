import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformAnalytics } from "@/lib/djangoApi";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);

    const [analyticsRes, eventRes] = await Promise.all([
      djangoFetch(`/api/events/${id}/analytics/`, { token }),
      djangoFetch(`/api/events/${id}/`, { token }),
    ]);

    if (!analyticsRes.ok) {
      return NextResponse.json({ error: "Analytics unavailable." }, { status: analyticsRes.status });
    }

    const analyticsData = await analyticsRes.json();
    let capacity = 0;
    if (eventRes.ok) {
      const event = await eventRes.json();
      capacity = event.capacity || 0;
    }

    return NextResponse.json(transformAnalytics(analyticsData, capacity));
  } catch (err) {
    console.error("[analytics GET] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
