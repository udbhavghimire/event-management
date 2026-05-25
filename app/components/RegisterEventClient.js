"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePaymentForm from "./StripePaymentForm";

export default function RegisterEventClient({ eventId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tierId, setTierId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [paymentSession, setPaymentSession] = useState(null);
  const [stripePublishableKey, setStripePublishableKey] = useState(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  );
  const router = useRouter();
  const { user, status } = useAuth() ?? {};

  const stripePromise = useMemo(
    () => (stripePublishableKey ? loadStripe(stripePublishableKey) : null),
    [stripePublishableKey]
  );

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error || !data.published) router.push("/");
        else {
          setEvent(data);
          if (data.ticketTiers.length > 0) {
            setTierId(String(data.ticketTiers[0].id));
          }
        }
        setLoading(false);
      });
  }, [eventId, router]);

  useEffect(() => {
    fetch("/api/payments/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.publishableKey) setStripePublishableKey(data.publishableKey);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setPaymentSession(null);
    setSubmitting(true);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketTierId: Number(tierId) }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Registration failed.");
      return;
    }

    if (data.requiresPayment) {
      if (!data.clientSecret) {
        setError("Payment is required but no payment session was created.");
        return;
      }
      if (data.clientSecret.startsWith("stub_secret")) {
        setError(
          "The API server is still using the stub payment gateway. On Render, set PAYMENT_GATEWAY=stripe and add your Stripe keys, then redeploy."
        );
        return;
      }
      if (!stripePublishableKey) {
        setError(
          "Stripe is not configured. Set PAYMENT_GATEWAY=stripe and STRIPE_PUBLISHABLE_KEY on the API server, " +
            "or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY on the frontend, then redeploy."
        );
        return;
      }
      setPaymentSession({
        registrationId: data.registrationId,
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
      });
      return;
    }

    setSuccess(true);
  }

  function handlePaymentSuccess() {
    setPaymentSession(null);
    setSuccess(true);
  }

  function handlePaymentCancel() {
    setPaymentSession(null);
    setError("Payment cancelled. Your registration is pending until payment is completed.");
  }

  if (loading) {
    return <div className="max-w-xl mx-auto px-4 py-12 animate-pulse"><div className="h-8 bg-slate-200 rounded w-2/3 mb-4" /></div>;
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Confirmed!</h2>
          <p className="text-slate-500 mb-2">Your QR code ticket will be sent to <strong>{user?.email}</strong>.</p>
          <p className="text-slate-400 text-sm mb-6">Please check your inbox (and spam folder).</p>
          <Link href="/" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-block">
            Browse more events
          </Link>
        </div>
      </div>
    );
  }

  const userRole = user?.role?.toUpperCase();
  if (status === "unauthenticated" || (user && userRole !== "ATTENDEE")) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Attendee account required</h2>
          <p className="text-slate-500 mb-6 text-sm">
            {user
              ? "You need an attendee account (not organizer) to register for events."
              : "Please sign in or create an attendee account to register for this event."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm">
              Sign in
            </Link>
            <Link href="/register" className="border border-indigo-300 text-indigo-600 px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-50 transition-colors text-sm">
              Create attendee account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedTier = event?.ticketTiers.find((t) => String(t.id) === tierId);
  const amountLabel = selectedTier
    ? selectedTier.price === 0
      ? "Free"
      : `A$${selectedTier.price.toFixed(2)}`
    : "–";

  if (paymentSession && stripePromise) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <Link href={`/events/${eventId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Event details
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Complete payment</h1>
            <p className="text-slate-500 mb-6">{event.title} — {amountLabel}</p>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentSession.clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <StripePaymentForm
                registrationId={paymentSession.registrationId}
                paymentIntentId={paymentSession.paymentIntentId}
                amountLabel={amountLabel}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <Link href={`/events/${eventId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Event details
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Register for Event</h1>
          <p className="text-slate-500 mb-6">{event.title}</p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">{error}</div>
            )}

            {event.ticketTiers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select ticket tier</label>
                <div className="space-y-2">
                  {event.ticketTiers.map((tier) => (
                    <label
                      key={tier.id}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                        String(tierId) === String(tier.id)
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      } ${tier.remaining === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="tier"
                          value={String(tier.id)}
                          checked={String(tierId) === String(tier.id)}
                          onChange={() => tier.remaining > 0 && setTierId(String(tier.id))}
                          disabled={tier.remaining === 0}
                          className="text-indigo-600"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{tier.name}</p>
                          <p className="text-xs text-slate-500">{tier.remaining} remaining</p>
                        </div>
                      </div>
                      <span className="font-bold text-indigo-600">
                        {tier.price === 0 ? "Free" : `A$${tier.price.toFixed(2)}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedTier && selectedTier.price > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-800">
                <strong>Payment required:</strong> {amountLabel}. You will pay securely with Stripe on the next step.
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between text-sm mb-4">
                <span className="text-slate-600">Total</span>
                <span className="font-bold text-slate-900">{amountLabel}</span>
              </div>
              <button
                type="submit"
                disabled={submitting || !tierId}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Processing..."
                  : selectedTier?.price === 0
                    ? "Register for Free"
                    : `Continue to pay ${amountLabel}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
