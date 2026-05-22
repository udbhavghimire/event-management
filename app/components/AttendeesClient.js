"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

function isRegistered(status) {
  return status === "CONFIRMED" || status === "REFUND_PENDING";
}

export default function AttendeesClient({ eventId }) {
  const [attendees, setAttendees] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  async function fetchData() {
    const [eventRes, attendeesRes] = await Promise.all([
      fetch(`/api/events/${eventId}`),
      fetch(`/api/events/${eventId}/attendees`),
    ]);
    setEvent(await eventRes.json());
    setAttendees(await attendeesRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function downloadCsv() {
    window.open(`/api/events/${eventId}/attendees?format=csv`, "_blank");
  }


  async function processApprove() {
    if (!refundModal) return;
    setRefunding(true);
    const res = await fetch(`/api/registrations/${refundModal.id}/refund/approve`, {
      method: "POST",
    });
    setRefunding(false);
    if (res.ok) {
      setRefundModal(null);
      fetchData();
    }
  }

  async function processReject() {
    if (!refundModal) return;
    setRefunding(true);
    const res = await fetch(`/api/registrations/${refundModal.id}/refund/reject`, {
      method: "POST",
    });
    setRefunding(false);
    if (res.ok) {
      setRefundModal(null);
      fetchData();
    }
  }

  function downloadCsvDirect() {
    window.open(`/api/events/${eventId}/attendees?format=csv`, "_blank");
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse"><div className="h-8 bg-slate-200 rounded w-1/2" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendees</h1>
          <p className="text-slate-500 mt-0.5">{event?.title} &bull; {attendees.length} registered</p>
        </div>
        <button
          onClick={downloadCsv}
          className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {attendees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
          <p>No registrations yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Attendee</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Ticket</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Check-in</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Feedback</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendees.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-900">{a.attendeeName}</p>
                      <p className="text-xs text-slate-400">{a.attendeeEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{a.ticketTier.name}</p>
                      <p className="text-xs text-slate-400">{a.ticketTier.price === 0 ? "Free" : `A$${a.ticketTier.price.toFixed(2)}`}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || "bg-slate-100 text-slate-600"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.checkedIn ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Checked in
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.feedback ? (
                        <span className="text-amber-600 font-medium text-xs">★ {a.feedback.rating}/5</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {a.status === "CONFIRMED" && (
                        <button
                          onClick={() => setRefundModal(a)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {refundModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-900 mb-1">Process Refund</h3>
            <p className="text-sm text-slate-500 mb-4">{refundModal.attendeeName}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for refund</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Provide a reason for this refund..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={processRefund}
                disabled={refunding || !refundReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {refunding ? "Processing..." : "Confirm Refund"}
              </button>
              <button
                onClick={() => { setRefundModal(null); setRefundReason(""); }}
                className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
