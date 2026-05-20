"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import Link from "next/link";

const STATUS_CONFIG = {
  PUBLISHED: { label: "Published", dot: "bg-green-500", badge: "bg-green-100 text-green-700" },
  DRAFT:     { label: "Draft",     dot: "bg-slate-400",  badge: "bg-slate-100 text-slate-600" },
  CANCELLED: { label: "Cancelled", dot: "bg-red-400",    badge: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function DashboardClient() {
  const { user } = useAuth() ?? {};
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    const res = await fetch("/api/events?mine=true");
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchEvents(); }, []);

  async function publishEvent(event) {
    await fetch(`/api/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    fetchEvents();
  }

  async function unpublishEvent(event) {
    await fetch(`/api/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DRAFT" }),
    });
    fetchEvents();
  }

  async function cancelEvent(event) {
    if (!confirm(`Cancel "${event.title}"? This cannot be undone easily.`)) return;
    await fetch(`/api/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    fetchEvents();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Events</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.name || user?.email}</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <svg className="w-14 h-14 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-slate-700 font-semibold text-lg mb-1">No events yet</h3>
          <p className="text-slate-400 text-sm mb-4">Create your first event to get started.</p>
          <Link href="/dashboard/events/new" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm inline-block">
            Create Event
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-4">Event</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-4 hidden sm:table-cell">Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-4 hidden md:table-cell">Capacity</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 text-sm">{event.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{event.venue}</p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell text-sm text-slate-500">
                    {new Date(event.startTime).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-sm text-slate-500">
                    {event._count.registrations} / {event.capacity}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <Link href={`/dashboard/events/${event.id}`} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Edit</Link>
                      <Link href={`/dashboard/events/${event.id}/tiers`} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Tiers</Link>
                      <Link href={`/dashboard/events/${event.id}/agenda`} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Agenda</Link>
                      <Link href={`/dashboard/events/${event.id}/attendees`} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Attendees</Link>
                      <Link href={`/dashboard/events/${event.id}/analytics`} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Analytics</Link>
                      {event.status === "DRAFT" && (
                        <button
                          onClick={() => publishEvent(event)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors bg-green-100 hover:bg-green-200 text-green-700"
                        >
                          Publish
                        </button>
                      )}
                      {event.status === "PUBLISHED" && (
                        <>
                          <button
                            onClick={() => unpublishEvent(event)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors bg-amber-100 hover:bg-amber-200 text-amber-700"
                          >
                            Unpublish
                          </button>
                          <button
                            onClick={() => cancelEvent(event)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors bg-red-100 hover:bg-red-200 text-red-700"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
