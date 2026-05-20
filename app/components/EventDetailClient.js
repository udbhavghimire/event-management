"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EventDetailClient({ eventId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.push("/");
        else setEvent(data);
        setLoading(false);
      });
  }, [eventId, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-2/3 mb-4" />
        <div className="h-4 bg-slate-200 rounded w-full mb-2" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
      </div>
    );
  }

  if (!event || !event.published) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        <p>Event not found or not available.</p>
        <Link href="/" className="text-indigo-600 hover:underline mt-2 inline-block">Back to events</Link>
      </div>
    );
  }

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const minPrice = event.ticketTiers.length > 0
    ? Math.min(...event.ticketTiers.map((t) => t.price))
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All events
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
            {minPrice !== null && (
              <span className="shrink-0 text-lg font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">
                {minPrice === 0 ? "Free" : `From A$${minPrice.toFixed(2)}`}
              </span>
            )}
          </div>

          <p className="text-slate-600 text-base leading-relaxed mb-8 whitespace-pre-line">{event.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <InfoBlock icon="calendar" label="Date">
              {start.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </InfoBlock>
            <InfoBlock icon="clock" label="Time">
              {start.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
            </InfoBlock>
            <InfoBlock icon="location" label="Venue">{event.venue}</InfoBlock>
            <InfoBlock icon="users" label="Capacity">{event.capacity} attendees</InfoBlock>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/register/${event.id}`}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-center"
            >
              Register Now
            </Link>
          </div>
        </div>
      </div>

      {event.ticketTiers.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Ticket Options</h2>
          <div className="grid gap-3">
            {event.ticketTiers.map((tier) => (
              <div key={tier.id} className={`flex items-center justify-between p-4 rounded-xl border ${tier.remaining > 0 ? "border-slate-200 bg-slate-50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                <div>
                  <p className="font-semibold text-slate-900">{tier.name}</p>
                  <p className="text-sm text-slate-500">{tier.remaining} of {tier.quantity} remaining</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600 text-lg">{tier.price === 0 ? "Free" : `A$${tier.price.toFixed(2)}`}</p>
                  {tier.remaining === 0 && <p className="text-xs text-red-500 font-medium">Sold out</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {event.agendaSessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Agenda</h2>
          <div className="space-y-4">
            {event.agendaSessions.map((session) => {
              const sessionStart = new Date(session.startTime);
              const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);
              return (
                <div key={session.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-right shrink-0 w-20">
                    <p className="text-sm font-semibold text-indigo-600">{sessionStart.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-xs text-slate-400">{sessionEnd.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="border-l-2 border-indigo-200 pl-4">
                    <p className="font-semibold text-slate-900">{session.title}</p>
                    <p className="text-sm text-slate-500">{session.speaker} &bull; {session.duration} min</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ icon, label, children }) {
  const icons = {
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
      <svg className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
      </svg>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-slate-800 font-medium text-sm">{children}</p>
      </div>
    </div>
  );
}
