import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function POST(req) {
  try {
    const token = getTokenFromRequest(req);
    const body = await req.json();

    const res = await djangoFetch("/api/checkins/", {
      method: "POST",
      body: { qr_token: body.qrCode || body.qr_token },
      token,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 409) {
        return NextResponse.json(
          { error: data?.detail || "Already checked in." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: data?.detail || "Check-in failed." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      registration: {
        attendeeName: data.attendee || "Attendee",
        attendeeEmail: "",
        event: "",
        ticketTier: "",
      },
      detail: data.detail,
    });
  } catch (err) {
    console.error("[checkin POST] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
