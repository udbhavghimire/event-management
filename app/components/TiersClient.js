"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TiersClient({ eventId }) {
  const [tiers, setTiers] = useState([]);
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", quantity: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchData() {
    const [eventRes, tiersRes] = await Promise.all([
      fetch(`/api/events/${eventId}`),
      fetch(`/api/events/${eventId}/tiers`),
    ]);
    setEvent(await eventRes.json());
    setTiers(await tiersRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function addTier(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch(`/api/events/${eventId}/tiers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, price: parseFloat(form.price), quantity: parseInt(form.quantity) }),
    });
    setSubmitting(false);
    if (!res.ok) { setError((await res.json()).error); return; }
    setForm({ name: "", price: "", quantity: "" });
    fetchData();
  }

  async function deleteTier(id) {
    if (!confirm("Delete this ticket tier?")) return;
    await fetch(`/api/ticket-tiers/${id}`, { method: "DELETE" });
    fetchData();
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse"><div className="h-8 bg-slate-200 rounded w-1/2" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Ticket Tiers</h1>
      <p className="text-slate-500 mb-8">{event?.title}</p>

      {tiers.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
          <div className="divide-y divide-slate-100">
            {tiers.map((tier) => (
              <div key={tier.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{tier.name}</p>
                  <p className="text-sm text-slate-500">{tier.remaining} / {tier.quantity} remaining</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-indigo-600">
                    {tier.price === 0 ? "Free" : `A$${tier.price.toFixed(2)}`}
                  </span>
                  <button
                    onClick={() => deleteTier(tier.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Ticket Tier</h2>
          <form onSubmit={addTier} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tier name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="General Admission"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (AUD)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? "Adding..." : "Add Tier"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
