"use client";

import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { user, status, logout } = useAuth() ?? {};
  const [menuOpen, setMenuOpen] = useState(false);

  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-indigo-600">EventEase</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Events</Link>
            {isAdmin && (
              <Link href="/admin" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Admin</Link>
            )}
            {isOrganizer && (
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Dashboard</Link>
            )}
            <Link href="/checkin" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Check-in</Link>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{user.name || user.email}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isAdmin ? "bg-purple-100 text-purple-700" :
                  user.role === "ATTENDEE" ? "bg-slate-100 text-slate-600" :
                  "bg-indigo-100 text-indigo-700"
                }`}>{user.role}</span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">Sign in</Link>
                <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Get started
                </Link>
              </div>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 text-sm font-medium text-slate-600">Events</Link>
            {isAdmin && (
              <Link href="/admin" className="block py-2 text-sm font-medium text-slate-600">Admin</Link>
            )}
            {isOrganizer && (
              <Link href="/dashboard" className="block py-2 text-sm font-medium text-slate-600">Dashboard</Link>
            )}
            <Link href="/checkin" className="block py-2 text-sm font-medium text-slate-600">Check-in</Link>
            {user ? (
              <button onClick={logout} className="block py-2 text-sm text-red-600 font-medium">Sign out</button>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-sm font-medium text-slate-600">Sign in</Link>
                <Link href="/register" className="block py-2 text-sm font-medium text-indigo-600">Get started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
