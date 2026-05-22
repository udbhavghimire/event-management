"use client";

import { useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const ELEMENT_STYLE = {
  base: {
    fontSize: "16px",
    color: "#0f172a",
    "::placeholder": { color: "#94a3b8" },
  },
  invalid: { color: "#dc2626" },
};

const CARD_NUMBER_OPTIONS = {
  style: ELEMENT_STYLE,
  placeholder: "4242 4242 4242 4242",
};

const CARD_EXPIRY_OPTIONS = {
  style: ELEMENT_STYLE,
  placeholder: "MM / YY",
};

const CARD_CVC_OPTIONS = {
  style: ELEMENT_STYLE,
  placeholder: "CVC",
};

function StripeField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="px-3.5 py-3 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
        {children}
      </div>
    </div>
  );
}

export default function StripePaymentForm({
  registrationId,
  clientSecret,
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
    if (!stripe || !elements || !clientSecret) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setError("Card form is not ready. Please refresh and try again.");
      return;
    }

    setError("");
    setPaying(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card: cardNumber } }
    );

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
      <div className="space-y-4">
        <StripeField label="Card number">
          <CardNumberElement options={CARD_NUMBER_OPTIONS} />
        </StripeField>
        <div className="grid grid-cols-2 gap-4">
          <StripeField label="Expiry">
            <CardExpiryElement options={CARD_EXPIRY_OPTIONS} />
          </StripeField>
          <StripeField label="CVC">
            <CardCvcElement options={CARD_CVC_OPTIONS} />
          </StripeField>
        </div>
      </div>
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
        Secured by Stripe. Use test card 4242 4242 4242 4242, any future expiry, any CVC.
      </p>
    </form>
  );
}
