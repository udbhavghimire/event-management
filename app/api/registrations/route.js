import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformMyRegistration } from "@/lib/djangoApi";

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    const res = await djangoFetch("/api/me/registrations/", { token });
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json((data || []).map(transformMyRegistration));
  } catch (err) {
    console.error("[registrations GET] error:", err);
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req) {
  try {
    const token = getTokenFromRequest(req);
    const body = await req.json();

    const djangoBody = { ticket_tier_id: body.ticketTierId };

    const res = await djangoFetch("/api/registrations/", { method: "POST", body: djangoBody, token });
    const data = await res.json();

    if (!res.ok) {
      const detail = data?.detail || data?.ticket_tier_id?.[0] || "Registration failed.";
      return NextResponse.json({ error: detail }, { status: res.status });
    }

    if (data.client_secret) {
      return NextResponse.json({
        requiresPayment: true,
        registrationId: data.registration_id,
        clientSecret: data.client_secret,
        paymentIntentId: data.payment_intent_id,
      }, { status: 201 });
    }

    return NextResponse.json({ ok: true, registration: data }, { status: 201 });
  } catch (err) {
    console.error("[registrations POST] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
