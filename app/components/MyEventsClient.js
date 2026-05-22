"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

const STATUS_COLORS = {
  CONFIRMED: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUND_PENDING: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-slate-100 text-slate-600",
};

const STATUS_LABELS = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
  REFUND_PENDING: "Pending Refund",
  REFUNDED: "Refunded",
};

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "PENDING", label: "Pending" },
  { id: "REFUND_PENDING", label: "Pending Refund" },
  { id: "REFUNDED", label: "Refunded" },
  { id: "CANCELLED", label: "Cancelled" },
];

const FILTER_EMPTY_LABELS = {
  REFUND_PENDING: "pending refund",
  REFUNDED: "refunded",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

export default function MyEventsClient() {
  const { user, status: authStatus } = useAuth() ?? {};
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredRegistrations = useMemo(() => {
    if (statusFilter === "ALL") return registrations;
    return registrations.filter((reg) => reg.status === statusFilter);
  }, [registrations, statusFilter]);

  const filterCounts = useMemo(() => {
    const counts = { ALL: registrations.length };
    for (const { id } of FILTERS) {
      if (id !== "ALL") {
        counts[id] = registrations.filter((r) => r.status === id).length;
      }
    }
    return counts;
  }, [registrations]);

  async function fetchRegistrations() {
    setLoading(true);
    const res = await fetch("/api/registrations");
    const data = await res.json();
    setRegistrations(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (authStatus === "authenticated" && user?.role === "ATTENDEE") {
      fetchRegistrations();
    } else if (authStatus !== "loading") {
      setLoading(false);
    }
  }, [authStatus, user?.role]);

  async function handleAction() {
    if (!actionModal) return;
    setProcessing(true);
    setError("");

    const { registration, type } = actionModal;
    const url =
      type === "cancel"
        ? `/api/registrations/${registration.id}/cancel`
        : `/api/registrations/${registration.id}/refund`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: type === "refund" ? JSON.stringify({ reason }) : undefined,
    });
    const data = await res.json();

    setProcessing(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }

    setActionModal(null);
    setReason("");
    fetchRegistrations();
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Browse Events
        </Link>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to view your events</h2>
        <p className="text-slate-500 mb-6">Your registered events appear here after you sign in.</p>
        <Link href="/login" className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
          Sign in
        </Link>
      </div>
    );
  }

  if (user?.role !== "ATTENDEE") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Browse Events
        </Link>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Attendee account required</h2>
        <p className="text-slate-500">My Events is available for attendee accounts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Browse Events
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Events</h1>
        <p className="text-slate-500 mt-1">Events you have registered for</p>
      </div>

      {registrations.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(({ id, label }) => {
            const active = statusFilter === id;
            const count = filterCounts[id] ?? 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    active ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <p className="text-slate-500 mb-4">You have not registered for any events yet.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            Browse events
          </Link>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-4">
            No {statusFilter === "ALL" ? "" : FILTER_EMPTY_LABELS[statusFilter] || statusFilter.toLowerCase()} registrations found.
          </p>
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Show all events
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((reg) => (
            <article
              key={reg.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-200 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Link
                      href={`/events/${reg.event.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {reg.event.title}
                    </Link>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[reg.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {STATUS_LABELS[reg.status] || reg.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {reg.ticketTier.name}
                    {" · "}
                    {reg.ticketTier.price === 0 ? "Free" : `A$${reg.ticketTier.price.toFixed(2)}`}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <p>
                      {formatDate(reg.event.startTime)} at {formatTime(reg.event.startTime)}
                    </p>
                    <p>{reg.event.venue}</p>
                    <p className="text-xs text-slate-400">
                      Registered {formatDate(reg.registeredAt)}
                    </p>
                  </div>
                  {reg.qrCode && reg.status === "CONFIRMED" && (
                    <p className="mt-2 text-xs font-mono text-slate-400 truncate">
                      Ticket: {reg.qrCode.slice(0, 16)}…
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link
                    href={`/events/${reg.event.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    View event
                  </Link>
                  {reg.canCancel && (
                    <button
                      type="button"
                      onClick={() => setActionModal({ registration: reg, type: "cancel" })}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  {reg.canRefund && (
                    <button
                      type="button"
                      onClick={() => setActionModal({ registration: reg, type: "refund" })}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium transition-colors"
                    >
                      Request refund
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-900 mb-1">
              {actionModal.type === "cancel" ? "Cancel registration" : "Request refund"}
            </h3>
            <p className="text-sm text-slate-500 mb-4">{actionModal.registration.event.title}</p>

            {actionModal.type === "refund" && (
              <>
                <p className="text-sm text-slate-600 mb-3">
                  Your request will be sent to the organizer for approval. You will not be refunded until it is approved.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Reason for refund
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Tell us why you need a refund..."
                  />
                </div>
              </>
            )}

            {actionModal.type === "cancel" && (
              <p className="text-sm text-slate-600 mb-4">
                This will cancel your registration. This action cannot be undone.
              </p>
            )}

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAction}
                disabled={
                  processing ||
                  (actionModal.type === "refund" && !reason.trim())
                }
                className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {processing
                  ? "Processing..."
                  : actionModal.type === "cancel"
                    ? "Confirm cancel"
                    : "Confirm refund"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionModal(null);
                  setReason("");
                  setError("");
                }}
                className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
