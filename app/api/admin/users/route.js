import { NextResponse } from "next/server";
import { djangoFetch, getTokenFromRequest, transformUser } from "@/lib/djangoApi";

export async function GET(req) {
  const token = getTokenFromRequest(req);
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const res = await djangoFetch(`/api/admin/users/?${params}`, { token });
  if (!res.ok) return NextResponse.json([], { status: res.status });

  const data = await res.json();
  const results = Array.isArray(data) ? data : data.results ?? [];
  return NextResponse.json(results.map(transformUser));
}
