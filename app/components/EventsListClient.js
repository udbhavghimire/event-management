"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

function EventCard({ event }) {
  const start = new Date(event.startTime);
  const minPrice = event.ticketTiers.length > 0
    ? Math.min(...event.ticketTiers.map((t) => t.price))
    : null;

  return (
    <Link href={`/events/${event.id}`} className="group block bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all overflow-hidden">
      <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-lg leading-snug">{event.title}</h3>
          {minPrice !== null && (
            <span className="shrink-0 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {minPrice === 0 ? "Free" : `A$${minPrice.toFixed(2)}+`}
            </span>
          )}
        </div>

        <p className="text-slate-500 text-sm line-clamp-2 mb-4">{event.description}</p>

        <div className="space-y-1.5 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{start.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{start.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 truncate">By {event.organizer.name || "Organizer"}</span>
          <span className="text-xs text-slate-600 font-medium shrink-0">
            {event._count.registrations} registered
            {event.ticketTiers[0]?.remaining != null && (
              <span className="text-slate-400 font-normal"> · {event.ticketTiers[0].remaining} left</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function EventsListClient() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (query) params.set("search", query);
    const res = await fetch(`/api/events?${params}`);
    const data = await res.json();
    setEvents(data);
    setLoading(false);
  }, [sort, query]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function handleSearch(e) {
    e.preventDefault();
    setQuery(search);
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-indigo-200 text-sm font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live events from EventEase
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Discover &amp; Join<br className="hidden sm:block" /> Amazing Events
            </h1>
            <p className="text-indigo-200 text-lg mb-8">
              Browse upcoming events, grab your tickets, and make memories that last.
            </p>

            {/* Inline search in hero */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, venue, or description…"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/60 bg-white"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-indigo-700 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Events section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              {query ? `Results for "${query}"` : "Upcoming Events"}
            </h2>
            {!loading && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                {events.length}
              </span>
            )}
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setSearch(""); }}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Clear
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort events"
            className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 font-medium shadow-sm"
          >
            <option value="asc">Soonest first</option>
            <option value="desc">Newest first</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-3 bg-slate-200" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-5/6" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-1">No events found</p>
            <p className="text-sm text-slate-400">
              {query ? "Try a different search term." : "No upcoming events yet — check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
