import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest } from "@/lib/djangoApi";

export async function POST(req) {
  try {
    const token = getTokenFromRequest(req);
    const body = await req.json();

    const djangoBody = {
      registration_id: body.registrationId,
      rating: body.rating,
      comment: body.comment || "",
    };

    const res = await djangoFetch("/api/feedback/", { method: "POST", body: djangoBody, token });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const detail = data?.detail || data?.error || Object.values(data)?.[0] || "Failed to submit feedback.";
      const message = Array.isArray(detail) ? detail[0] : detail;
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[feedback POST] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
