"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

export default function StripePaymentForm({
  registrationId,
  paymentIntentId,
  amountLabel,
  onSuccess,
  onCancel,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError("");
    setPaying(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setPaying(false);
      setError(stripeError.message || "Payment failed.");
      return;
    }

    const intentId = paymentIntent?.id || paymentIntentId;
    const res = await fetch(`/api/registrations/${registrationId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentId }),
    });
    const data = await res.json();
    setPaying(false);

    if (!res.ok) {
      setError(data.error || "Could not confirm your registration.");
      return;
    }

    onSuccess(data.registration);
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={!stripe || paying}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {paying ? "Processing payment..." : `Pay ${amountLabel}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={paying}
          className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center">
        Secured by Stripe. Card test number: 4242 4242 4242 4242 — any future expiry, any CVC.
      </p>
    </form>
  );
}
