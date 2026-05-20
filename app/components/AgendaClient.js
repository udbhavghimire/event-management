"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AgendaClient({ eventId }) {
  const [sessions, setSessions] = useState([]);
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({ title: "", speaker: "", startTime: "", duration: "" });
  // Note: AgendaClient proxies to Django via /api/events/:id/agenda which transforms fields
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchData() {
    const [eventRes, agendaRes] = await Promise.all([
      fetch(`/api/events/${eventId}`),
      fetch(`/api/events/${eventId}/agenda`),
    ]);
    const eventData = await eventRes.json();
    setEvent(eventData);
    setSessions(await agendaRes.json());
    const t = eventData.startTime || eventData.start_time;
    if (t) {
      setForm((f) => ({ ...f, startTime: new Date(t).toISOString().slice(0, 16) }));
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function addSession(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch(`/api/events/${eventId}/agenda`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration: parseInt(form.duration) }),
    });
    setSubmitting(false);
    if (!res.ok) { setError((await res.json()).error); return; }
    setForm((f) => ({ ...f, title: "", speaker: "", duration: "" }));
    fetchData();
  }

  async function deleteSession(id) {
    if (!confirm("Remove this session?")) return;
    await fetch(`/api/agenda-sessions/${id}`, { method: "DELETE" });
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

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Agenda</h1>
      <p className="text-slate-500 mb-8">{event?.title}</p>

      {sessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
          <div className="divide-y divide-slate-100">
            {sessions.map((s) => {
              const start = new Date(s.startTime);
              const end = new Date(start.getTime() + s.duration * 60000);
              return (
                <div key={s.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex gap-4">
                    <div className="text-right w-16 shrink-0">
                      <p className="text-sm font-semibold text-indigo-600">{start.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="text-xs text-slate-400">{end.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{s.title}</p>
                      <p className="text-sm text-slate-500">{s.speaker} &bull; {s.duration} min</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Session</h2>
          <form onSubmit={addSession} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Session title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Opening Keynote"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Speaker name</label>
              <input
                type="text"
                required
                value={form.speaker}
                onChange={(e) => setForm({ ...form, speaker: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Start time</label>
                <input
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (minutes)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="60"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? "Adding..." : "Add Session"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
