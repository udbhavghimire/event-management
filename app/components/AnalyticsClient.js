"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function StatCard({ label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-green-500 to-green-600",
    amber: "from-amber-500 to-amber-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-5`} />
      <p className="text-sm font-medium text-slate-500 mb-2">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsClient({ eventId }) {
  const [analytics, setAnalytics] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${eventId}`).then((r) => r.json()),
      fetch(`/api/events/${eventId}/analytics`).then((r) => r.json()),
    ]).then(([eventData, analyticsData]) => {
      setEvent(eventData);
      setAnalytics(analyticsData);
      setLoading(false);
    });
  }, [eventId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 h-32" />
          ))}
        </div>
      </div>
    );
  }

  const capacityUsed = analytics.capacity > 0
    ? ((analytics.ticketsSold / analytics.capacity) * 100).toFixed(0)
    : 0;

  const revenue = typeof analytics.revenue === "number" ? analytics.revenue : parseFloat(analytics.revenue || 0);

  const tierEntries = Object.entries(analytics.tierBreakdown || {});
  const dailyEntries = Object.entries(analytics.dailySales || {}).sort(([a], [b]) => a.localeCompare(b));
  const maxDaily = dailyEntries.length > 0 ? Math.max(...dailyEntries.map(([, v]) => v)) : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Analytics</h1>
      <p className="text-slate-500 mb-8">{event?.title}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Tickets Sold" value={analytics.ticketsSold} sub={`${capacityUsed}% of capacity`} color="indigo" />
        <StatCard label="Revenue" value={`A$${revenue.toFixed(2)}`} sub="Total confirmed" color="green" />
        <StatCard label="Check-in Rate" value={`${analytics.checkinRate}%`} sub={`${analytics.checkedIn} checked in`} color="amber" />
        <StatCard
          label="Avg. Rating"
          value={analytics.avgRating !== null ? `${analytics.avgRating} / 5` : "—"}
          sub={analytics.feedbackCount > 0 ? `${analytics.feedbackCount} reviews` : "No feedback yet"}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {tierEntries.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Sales by Tier</h2>
            <div className="space-y-3">
              {tierEntries.map(([name, count]) => {
                const total = analytics.ticketsSold || 1;
                const pct = ((count / total) * 100).toFixed(0);
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{name}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full">
                      <div
                        className="h-2 bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {dailyEntries.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Daily Registrations</h2>
            <div className="flex items-end gap-1.5 h-32">
              {dailyEntries.map(([date, count]) => {
                const height = maxDaily > 0 ? (count / maxDaily) * 100 : 0;
                return (
                  <div key={date} className="flex flex-col items-center flex-1 gap-1" title={`${date}: ${count}`}>
                    <span className="text-xs text-slate-500">{count}</span>
                    <div
                      className="w-full bg-indigo-500 rounded-t-sm transition-all"
                      style={{ height: `${height}%`, minHeight: "4px" }}
                    />
                    <span className="text-xs text-slate-400 rotate-45 origin-left hidden lg:block" style={{ fontSize: "9px" }}>
                      {date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Capacity Overview</h2>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${Math.min(capacityUsed, 100)}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-700 w-12 text-right">{capacityUsed}%</span>
        </div>
        <p className="text-sm text-slate-500">{analytics.ticketsSold} sold out of {analytics.capacity || "?"} capacity</p>
      </div>
    </div>
  );
}
