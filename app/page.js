"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import EventsListClient from "./components/EventsListClient";

export default function HomePage() {
  const { user, status } = useAuth() ?? {};
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const role = user?.role?.toUpperCase();
    if (role === "ORGANIZER" || role === "ADMIN") {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  // Blank while redirect is in flight for organizers/admins
  if (status !== "loading" && (user?.role?.toUpperCase() === "ORGANIZER" || user?.role?.toUpperCase() === "ADMIN")) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <EventsListClient />
    </div>
  );
}
