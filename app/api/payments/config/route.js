import { NextResponse } from "next/server";
import { djangoFetch } from "@/lib/djangoApi";

export async function GET() {
  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  try {
    const res = await djangoFetch("/api/payments/config/");
    const data = await res.json();

    if (res.ok) {
      const publishableKey = data.publishable_key || envKey;
      return NextResponse.json({
        paymentGateway: data.payment_gateway,
        publishableKey,
        stripeEnabled: data.stripe_enabled ?? data.payment_gateway === "stripe",
        currency: data.currency || "aud",
      });
    }
  } catch (err) {
    console.error("[payments/config GET] django error:", err);
  }

  if (envKey) {
    return NextResponse.json({
      paymentGateway: "stripe",
      publishableKey: envKey,
      stripeEnabled: true,
      currency: "aud",
    });
  }

  return NextResponse.json(
    { error: "Stripe is not configured on the server." },
    { status: 503 }
  );
}
