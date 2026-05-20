"use client";

import AuthProvider from "./AuthProvider";

export default function AuthSessionProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
