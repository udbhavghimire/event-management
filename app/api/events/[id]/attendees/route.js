import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/djangoApi";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const { searchParams } = new URL(req.url);

    const djangoUrl = process.env.DJANGO_API_URL || "http://localhost:8000";
    const res = await fetch(`${djangoUrl}/api/events/${id}/attendees.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Unable to fetch attendees." }, { status: res.status });
    }

    if (searchParams.get("format") === "csv") {
      const csvText = await res.text();
      return new NextResponse(csvText, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="event_${id}_attendees.csv"`,
        },
      });
    }

    const csvText = await res.text();
    const lines = csvText.trim().split("\n");
    if (lines.length <= 1) return NextResponse.json([]);

    const rows = lines.slice(1).map((line) => {
      const vals = line.split(",");
      const hasStatusCol = vals.length >= 7;
      return {
        id: vals[0],
        attendeeName: vals[1],
        attendeeEmail: vals[2],
        ticketTier: { name: vals[3], price: 0 },
        registeredAt: vals[4],
        status: hasStatusCol ? vals[5]?.trim() : "CONFIRMED",
        checkedIn: hasStatusCol ? vals[6]?.trim() === "yes" : vals[5]?.trim() === "yes",
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[attendees GET] error:", err);
    return NextResponse.json([], { status: 503 });
  }
}
