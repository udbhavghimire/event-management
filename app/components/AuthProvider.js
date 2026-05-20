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
    const u = readUserCookie();
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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    document.cookie = "user_info=; max-age=0; path=/";
    setUser(null);
    setStatus("unauthenticated");
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
