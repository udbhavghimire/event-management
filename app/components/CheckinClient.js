"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import Link from "next/link";

export default function CheckinClient() {
  const { user, status } = useAuth() ?? {};
  const [qrCode, setQrCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  async function handleCheckin(e) {
    e.preventDefault();
    if (!qrCode.trim()) return;
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCode: qrCode.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setResult({ type: "success", ...data });
      setRecentCheckins((prev) => [
        { ...data.registration, id: Date.now(), timestamp: new Date() },
        ...prev.slice(0, 4),
      ]);
    } else if (res.status === 409) {
      setResult({ type: "duplicate", error: data.error, checkedInAt: data.checkedInAt });
    } else {
      setResult({ type: "error", error: data.error });
    }

    setQrCode("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-10">
          <svg className="w-14 h-14 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in required</h2>
          <p className="text-slate-500 mb-6 text-sm">You must be signed in to use the check-in tool.</p>
          <Link href="/login" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-block text-sm">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Event Check-in</h1>
      <p className="text-slate-500 mb-8 text-sm">Scan or enter a QR ticket code to check in an attendee.</p>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="p-6">
          <form onSubmit={handleCheckin} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Scan or enter ticket code..."
              className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !qrCode.trim()}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Checking..." : "Check In"}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-3">
            For camera-based scanning, use a QR scanner app and ensure it types into the field above.
          </p>
        </div>
      </div>

      {result && (
        <div className={`rounded-2xl border p-6 mb-6 ${
          result.type === "success" ? "bg-green-50 border-green-200" :
          result.type === "duplicate" ? "bg-amber-50 border-amber-200" :
          "bg-red-50 border-red-200"
        }`}>
          {result.type === "success" && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-green-800 text-lg">Check-in Successful!</p>
                <p className="text-green-700 font-medium">{result.registration.attendeeName}</p>
                <p className="text-green-600 text-sm">{result.registration.attendeeEmail}</p>
                <p className="text-green-600 text-sm mt-1">{result.registration.event} &bull; {result.registration.ticketTier}</p>
              </div>
            </div>
          )}
          {result.type === "duplicate" && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-amber-800 text-lg">Already Checked In</p>
                <p className="text-amber-700 text-sm">{result.error}</p>
                {result.checkedInAt && (
                  <p className="text-amber-600 text-xs mt-1">
                    Checked in at {new Date(result.checkedInAt).toLocaleTimeString("en-AU")}
                  </p>
                )}
              </div>
            </div>
          )}
          {result.type === "error" && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-red-800 text-lg">Check-in Failed</p>
                <p className="text-red-700 text-sm">{result.error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {recentCheckins.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">Recent Check-ins</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentCheckins.map((c) => (
              <div key={c.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{c.attendeeName}</p>
                  <p className="text-xs text-slate-400">{c.event} &bull; {c.ticketTier}</p>
                </div>
                <span className="text-xs text-slate-400">
                  {c.timestamp.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
