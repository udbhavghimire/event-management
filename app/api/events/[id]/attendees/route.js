import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function GET(req, { params }) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  const { searchParams } = new URL(req.url);

  // Proxy the CSV download
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

  // Parse CSV and return JSON for the attendee table
  const csvText = await res.text();
  const lines = csvText.trim().split("\n");
  if (lines.length <= 1) return NextResponse.json([]);

  const headers = lines[0].split(",");
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",");
    return {
      id: vals[0],
      attendeeName: vals[1],
      attendeeEmail: vals[2],
      ticketTier: { name: vals[3], price: 0 },
      registeredAt: vals[4],
      checkedIn: vals[5]?.trim() === "yes",
      status: "CONFIRMED",
    };
  });

  return NextResponse.json(rows);
}
