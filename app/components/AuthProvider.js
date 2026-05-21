"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function readCookie(name) {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? JSON.parse(decodeURIComponent(match[1])) : null;
  } catch {
    return null;
  }
}

function readUserCookie() {
  return readCookie("user_info");
}

// Write a persistent hint so role + name survive logout and page refreshes.
// This cookie is NOT cleared on logout — it only stores non-sensitive profile
// info (role, name, org) and is refreshed on every successful login.
function writeProfileHint(u) {
  if (typeof document === "undefined" || !u?.email) return;
  try {
    const hint = {
      email: u.email,
      role: u.role,
      name: u.name,
      organisation_name: u.organisation_name || "",
      contact_phone: u.contact_phone || "",
    };
    const ONE_YEAR = 365 * 24 * 60 * 60;
    document.cookie = `profile_hint=${encodeURIComponent(JSON.stringify(hint))}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    // Also keep localStorage in sync as a secondary fallback
    localStorage.setItem(`profile:${u.email}`, JSON.stringify(hint));
  } catch { /* ignore */ }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const u = readUserCookie();
    setUser(u);
    setStatus(u ? "authenticated" : "unauthenticated");
  }, []);

  async function login(email, password) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // Start with what the API returned (Django login returns tokens only, no role)
    let u = data.user || { email };

    // Role recovery: the backend has no /me/ endpoint, so we use locally-stored hints.
    // Priority: profile_hint cookie (survives logout) → localStorage (written at registration)
    if (!u.role) {
      // 1. Persistent cookie hint — written after every successful login, survives logout
      const cookieHint = readCookie("profile_hint");
      if (cookieHint?.email === email && cookieHint?.role) {
        u = { ...cookieHint, ...u, role: cookieHint.role };
      }
    }
    if (!u.role) {
      // 2. localStorage fallback — written at registration time
      try {
        const stored = localStorage.getItem(`profile:${email}`);
        if (stored) {
          const hint = JSON.parse(stored);
          if (hint?.email === email && hint?.role) {
            u = { ...hint, ...u, role: hint.role };
          }
        }
      } catch { /* ignore */ }
    }

    // Patch the session cookie so the role survives page refreshes within this session
    if (u.role) {
      try {
        document.cookie = `user_info=${encodeURIComponent(JSON.stringify(u))}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
      } catch { /* ignore */ }
    }

    // Always refresh the persistent hint so future logins on this browser also work
    writeProfileHint(u);

    setUser(u);
    setStatus("authenticated");
    return u;
  }

  // Call after registration to sync React state with the already-set cookie
  function refreshUser() {
    const u = readUserCookie();
    setUser(u);
    setStatus(u ? "authenticated" : "unauthenticated");
    return u;
  }

  // Full logout — clears session and navigates to home
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    document.cookie = "user_info=; max-age=0; path=/";
    setUser(null);
    setStatus("unauthenticated");
    window.location.href = "/";
  }

  // Silent logout — clears session without any page redirect (used on login page)
  async function silentLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    document.cookie = "user_info=; max-age=0; path=/";
    setUser(null);
    setStatus("unauthenticated");
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout, silentLogout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
