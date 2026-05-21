"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function readUserCookie() {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)user_info=([^;]*)/);
    if (!match) return null;
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
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

    // Start with what the API returned (role may be empty — backend has no /me/ endpoint)
    let u = data.user || readUserCookie() || { email };

    // Merge the locally-cached profile hint (written during registration) so that
    // role, name, and organisation_name are always available on the client.
    if (!u.role) {
      try {
        const stored = localStorage.getItem(`profile:${email}`);
        if (stored) {
          const hint = JSON.parse(stored);
          u = { ...hint, ...u, role: hint.role }; // hint.role wins since API has none
        }
      } catch { /* ignore */ }
    }

    // Patch the user_info cookie so the role survives page refreshes
    if (u.role) {
      try {
        document.cookie = `user_info=${encodeURIComponent(JSON.stringify(u))}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
      } catch { /* ignore */ }
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
