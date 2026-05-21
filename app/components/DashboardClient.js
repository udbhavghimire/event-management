"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Link from "next/link";

const STATUS_CONFIG = {
  PUBLISHED: { label: "Published", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  DRAFT:     { label: "Draft",     dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600 ring-slate-200" },
  CANCELLED: { label: "Cancelled", dot: "bg-red-400",     badge: "bg-red-50 text-red-700 ring-red-200" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const { user, status } = useAuth() ?? {};
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Guard: only organizers/admins may view the dashboard
  useEffect(() => {
    if (status === "loading") return;
    const role = user?.role?.toUpperCase();
    if (!user || (role !== "ORGANIZER" && role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [status, user, router]);

  async function fetchEvents() {
    setLoading(true);
    const res = await fetch("/api/events?mine=true");
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchEvents(); }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function changeStatus(event, status) {
    setActionLoading(event.id + status);
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    if (res.ok) {
      showToast(`Event ${status === "PUBLISHED" ? "published" : status === "DRAFT" ? "unpublished" : "cancelled"} successfully.`);
      fetchEvents();
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error || "Action failed.", "error");
    }
  }

  async function cancelEvent(event) {
    if (!confirm(`Cancel "${event.title}"?\n\nThis cannot be undone easily.`)) return;
    changeStatus(event, "CANCELLED");
  }

  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === "PUBLISHED").length,
    draft: events.filter((e) => e.status === "DRAFT").length,
    totalAttendees: events.reduce((s, e) => s + (e._count?.registrations || 0), 0),
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] || "?").toUpperCase();

  // Show skeleton while auth is loading or before guard redirect fires
  if (status === "loading" || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-36 bg-slate-200 rounded-2xl mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 sm:p-8 mb-8 shadow-lg shadow-indigo-200">
        {/* decorative circles */}
        <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-2 w-52 h-52 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            {/* Circular avatar */}
            <div className="w-16 h-16 rounded-full bg-white/20 ring-4 ring-white/30 flex items-center justify-center text-white font-extrabold text-xl shrink-0 backdrop-blur-sm select-none">
              {initials}
            </div>
            <div>
              <p className="text-indigo-200 text-sm font-medium">Welcome back,</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {user?.name || user?.email || "Organizer"}
              </h1>
              {user?.organisation_name && (
                <p className="text-indigo-200 text-sm mt-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {user.organisation_name}
                </p>
              )}
            </div>
          </div>

          {/* Add New Event CTA */}
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2.5 bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 active:bg-indigo-100 transition-colors text-sm shadow-md shrink-0 self-start sm:self-auto"
          >
            <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            Add New Event
          </Link>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            color="indigo"
            value={stats.total}
            label="Total Events"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <StatCard
            color="emerald"
            value={stats.published}
            label="Published"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            color="amber"
            value={stats.draft}
            label="Draft"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          />
          <StatCard
            color="rose"
            value={stats.totalAttendees}
            label="Total Registrations"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </div>
      )}

      {/* Events list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">My Events</h2>
          <span className="text-xs text-slate-400">{events.length} event{events.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-4 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-slate-700 font-semibold text-lg mb-1">No events yet</h3>
            <p className="text-slate-400 text-sm mb-5">Create your first event to get started.</p>
            <Link
              href="/dashboard/events/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {events.map((event) => {
              const start = new Date(event.startTime);
              const registrations = event._count?.registrations || 0;
              const pct = event.capacity > 0 ? Math.min(100, Math.round((registrations / event.capacity) * 100)) : 0;
              return (
                <div key={event.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={event.status} />
                        <span className="text-xs text-slate-400">
                          {start.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                          {" · "}
                          {start.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 text-base truncate">{event.title}</h3>
                      <p className="text-sm text-slate-400 truncate mt-0.5">{event.venue}</p>

                      {/* Capacity bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-rose-500" : pct >= 60 ? "bg-amber-400" : "bg-emerald-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{registrations} / {event.capacity}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap lg:flex-nowrap">
                      <Link href={`/dashboard/events/${event.id}`} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Edit</Link>
                      <Link href={`/dashboard/events/${event.id}/tiers`} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Tiers</Link>
                      <Link href={`/dashboard/events/${event.id}/agenda`} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Agenda</Link>
                      <Link href={`/dashboard/events/${event.id}/attendees`} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Attendees</Link>
                      <Link href={`/dashboard/events/${event.id}/analytics`} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">Analytics</Link>

                      {event.status === "DRAFT" && (
                        <button
                          onClick={() => changeStatus(event, "PUBLISHED")}
                          disabled={actionLoading === event.id + "PUBLISHED"}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-emerald-100 hover:bg-emerald-200 text-emerald-700 disabled:opacity-50"
                        >
                          {actionLoading === event.id + "PUBLISHED" ? "..." : "Publish"}
                        </button>
                      )}
                      {event.status === "PUBLISHED" && (
                        <>
                          <button
                            onClick={() => changeStatus(event, "DRAFT")}
                            disabled={actionLoading === event.id + "DRAFT"}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-amber-100 hover:bg-amber-200 text-amber-700 disabled:opacity-50"
                          >
                            {actionLoading === event.id + "DRAFT" ? "..." : "Unpublish"}
                          </button>
                          <button
                            onClick={() => cancelEvent(event)}
                            disabled={actionLoading === event.id + "CANCELLED"}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50"
                          >
                            {actionLoading === event.id + "CANCELLED" ? "..." : "Cancel"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
