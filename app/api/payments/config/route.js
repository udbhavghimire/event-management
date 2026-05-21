import { NextResponse } from "next/server";
import { djangoFetch } from "@/lib/djangoApi";

export async function GET() {
  try {
    const res = await djangoFetch("/api/payments/config/");
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to load payment config." }, { status: res.status });
    }
    return NextResponse.json({
      paymentGateway: data.payment_gateway,
      publishableKey: data.publishable_key,
      currency: data.currency,
    });
  } catch (err) {
    console.error("[payments/config GET] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
