"use client";

import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { user, status, logout } = useAuth() ?? {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const role = user?.role?.toUpperCase();
  const isOrganizer = role === "ORGANIZER" || role === "ADMIN";
  const isAttendee = role === "ATTENDEE";
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] || "?").toUpperCase();

  const roleColors = {
    ADMIN: "bg-purple-100 text-purple-700",
    ORGANIZER: "bg-indigo-100 text-indigo-700",
    ATTENDEE: "bg-slate-100 text-slate-600",
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo — organizers go to dashboard, everyone else to home */}
          <Link href={isOrganizer ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-indigo-600">EventEase</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Browse Events is only visible to attendees and guests — not organizers */}
            {!isOrganizer && (
              <Link href="/" className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors">
                Browse Events
              </Link>
            )}
            {isAttendee && (
              <Link href="/my-events" className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors">
                My Events
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors">
                Admin
              </Link>
            )}
            {isOrganizer && (
              <Link href="/dashboard" className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors">
                Dashboard
              </Link>
            )}
            {isOrganizer && (
              <Link href="/dashboard/events/new" className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors">
                + New Event
              </Link>
            )}
          </div>

          {/* User area */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900 leading-tight">{user.name || user.email}</p>
                    {user.organisation_name && (
                      <p className="text-xs text-slate-400 leading-tight">{user.organisation_name}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${roleColors[user.role] || roleColors.ATTENDEE}`}>
                    {user.role}
                  </span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.name || user.email}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    {isAttendee && (
                      <Link href="/my-events" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        My Events
                      </Link>
                    )}
                    {isOrganizer && (
                      <>
                        <Link href="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                          Dashboard
                        </Link>
                        <Link href="/dashboard/events/new" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Create Event
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  Sign in
                </Link>
                <Link href="/register" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-slate-100 space-y-1">
            {!isOrganizer && (
              <Link href="/" className="block px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(false)}>Browse Events</Link>
            )}
            {isAttendee && (
              <Link href="/my-events" className="block px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(false)}>My Events</Link>
            )}
            {isAdmin && <Link href="/admin" className="block px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(false)}>Admin</Link>}
            {isOrganizer && <Link href="/dashboard" className="block px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
            {isOrganizer && <Link href="/dashboard/events/new" className="block px-3 py-2 text-sm font-medium text-indigo-600 rounded-lg hover:bg-indigo-50" onClick={() => setMenuOpen(false)}>+ Create Event</Link>}
            {user ? (
              <div className="pt-2 border-t border-slate-100 mt-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{user.name || user.email}</p>
                  {user.organisation_name && <p className="text-xs text-indigo-600">{user.organisation_name}</p>}
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                <Link href="/login" className="block px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link href="/register" className="block px-3 py-2 text-sm font-medium text-indigo-600 rounded-lg hover:bg-indigo-50" onClick={() => setMenuOpen(false)}>Get started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
