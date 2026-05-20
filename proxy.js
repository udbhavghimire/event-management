import { NextResponse } from "next/server";

export default function proxy(req) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get("access_token")?.value;
  let role = null;
  const userInfoRaw = req.cookies.get("user_info")?.value;
  if (userInfoRaw) {
    try {
      role = JSON.parse(decodeURIComponent(userInfoRaw)).role;
    } catch {
      role = null;
    }
  }

  const isAdminPath = pathname.startsWith("/admin");
  const isOrganizerPath = pathname.startsWith("/dashboard");

  if (isAdminPath && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isOrganizerPath) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "ORGANIZER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
