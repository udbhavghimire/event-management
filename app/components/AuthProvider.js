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
    let cancelled = false;

    async function loadSession() {
      const cached = readUserCookie();
      if (cached?.role) {
        if (!cancelled) {
          setUser({ ...cached, role: cached.role.toUpperCase() });
          setStatus("authenticated");
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.user) {
            setUser(data.user);
            setStatus("authenticated");
            writeProfileHint(data.user);
            return;
          }
        }
      } catch { /* ignore */ }

      if (!cancelled) {
        setUser(cached);
        setStatus(cached ? "authenticated" : "unauthenticated");
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email, password) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    let u = data.user || { email };

    // Fallback for older sessions before backend returned role on login
    if (!u.role) {
      const cookieHint = readCookie("profile_hint");
      if (cookieHint?.email === email && cookieHint?.role) {
        u = { ...cookieHint, ...u, role: cookieHint.role };
      }
    }
    if (!u.role) {
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

    if (u.role) {
      u = { ...u, role: u.role.toUpperCase() };
      try {
        document.cookie = `user_info=${encodeURIComponent(JSON.stringify(u))}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
      } catch { /* ignore */ }
      writeProfileHint(u);
    }

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
