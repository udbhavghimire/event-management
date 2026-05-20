"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EventFormClient({ mode = "create", eventId }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", startTime: "", endTime: "", venue: "", capacity: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && eventId) {
      fetch(`/api/events/${eventId}`)
        .then((r) => r.json())
        .then((data) => {
          setForm({
            title: data.title,
            description: data.description,
            startTime: new Date(data.startTime).toISOString().slice(0, 16),
            endTime: new Date(data.endTime).toISOString().slice(0, 16),
            venue: data.venue,
            capacity: data.capacity.toString(),
          });
          setFetching(false);
        });
    }
  }, [mode, eventId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = mode === "create" ? "/api/events" : `/api/events/${eventId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        capacity: parseInt(form.capacity),
      }),
    });

    setLoading(false);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to save event.");
      return;
    }

    // After creating redirect to the event detail page so organiser can manage it
    if (mode === "create" && data?.id) {
      router.push(`/dashboard/events/${data.id}/tiers`);
    } else {
      router.push("/dashboard");
    }
  }

  if (fetching) {
    return <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse"><div className="h-8 bg-slate-200 rounded w-1/2 mb-4" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            {mode === "create" ? "Create New Event" : "Edit Event"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Event title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="My Awesome Conference 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Tell attendees what your event is about..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Start time <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">End time <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Venue <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Sydney Convention Centre, NSW"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="100"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? "Saving..." : mode === "create" ? "Create Event" : "Save Changes"}
              </button>
              <Link href="/dashboard" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
