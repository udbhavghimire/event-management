"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Link from "next/link";

export default function EventFormClient({ mode = "create", eventId }) {
  const router = useRouter();
  const { user, status } = useAuth() ?? {};
  const [form, setForm] = useState({
    title: "", description: "", startTime: "", endTime: "", venue: "", capacity: "50",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");
  const [error, setError] = useState("");

  // Guard: only organizers/admins may access this form
  useEffect(() => {
    if (status === "loading") return;
    const role = user?.role?.toUpperCase();
    if (!user || (role !== "ORGANIZER" && role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [status, user, router]);

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
          setExistingImageUrl(data.imageUrl || data.imageThumbnailUrl || null);
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

    let fetchOpts;
    if (imageFile) {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("startTime", form.startTime);
      fd.append("endTime", form.endTime);
      fd.append("venue", form.venue);
      fd.append("capacity", String(parseInt(form.capacity, 10)));
      fd.append("image", imageFile);
      fetchOpts = { method, body: fd };
    } else {
      fetchOpts = {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          capacity: parseInt(form.capacity, 10),
        }),
      };
    }

    const res = await fetch(url, fetchOpts);

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

  // Show skeleton while auth is resolving or event is loading
  if (status === "loading" || fetching) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-24" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-24 bg-slate-100 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-slate-100 rounded" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-indigo-100 rounded" />
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] || "?").toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />

        {/* Organizer context banner */}
        <div className="flex items-center gap-3 px-8 pt-6 pb-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name || user?.email}</p>
            {user?.organisation_name && (
              <p className="text-xs text-slate-400 leading-tight">{user.organisation_name}</p>
            )}
          </div>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium ring-1 ring-indigo-100">
            {mode === "create" ? "New Event" : "Editing Event"}
          </span>
        </div>

        <div className="p-8 pt-5">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {mode === "create" ? "Create a New Event" : "Edit Event"}
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            {mode === "create"
              ? "Fill in the details below. The event will be published immediately and visible to attendees."
              : "Update the event details and save your changes."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Event title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
                placeholder="My Awesome Conference 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Event image</label>
              <p className="text-xs text-slate-400 mb-2">
                Shown on event cards (optimized) and the event detail page (full size). JPEG, PNG, or WebP, max 5 MB.
              </p>
              {(imagePreview || existingImageUrl) && (
                <div className="relative mb-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview || existingImageUrl}
                    alt="Event preview"
                    className="w-full h-40 object-cover"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 text-xs bg-white/90 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 hover:bg-white"
                    >
                      Remove new image
                    </button>
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    setError("Image must be 5 MB or smaller.");
                    e.target.value = "";
                    return;
                  }
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                  setError("");
                }}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputCls} resize-none`}
                placeholder="Tell attendees what your event is about..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Start date & time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  End date & time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Venue <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className={`${inputCls} pl-9`}
                  placeholder="Sydney Convention Centre, NSW"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Capacity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className={`${inputCls} pl-9`}
                  placeholder="100"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Maximum number of attendees for this event.</p>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : mode === "create" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Publish Event
                  </>
                ) : "Save Changes"}
              </button>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
