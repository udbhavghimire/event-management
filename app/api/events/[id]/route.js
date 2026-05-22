import { NextResponse } from "next/server";
import {
  djangoFetch,
  djangoFetchMultipart,
  getTokenFromRequest,
  transformEvent,
} from "@/lib/djangoApi";

function appendEventFields(djangoForm, body) {
  if (body.title !== undefined) djangoForm.append("title", String(body.title));
  if (body.description !== undefined) djangoForm.append("description", String(body.description));
  if (body.venue !== undefined) djangoForm.append("venue", String(body.venue));
  if (body.capacity !== undefined) djangoForm.append("capacity", String(body.capacity));
  if (body.startTime !== undefined) djangoForm.append("start_time", String(body.startTime));
  if (body.endTime !== undefined) djangoForm.append("end_time", String(body.endTime));
}

async function buildDjangoFormFromRequest(req) {
  const form = await req.formData();
  const djangoForm = new FormData();
  const body = {
    title: form.get("title"),
    description: form.get("description"),
    venue: form.get("venue"),
    capacity: form.get("capacity"),
    startTime: form.get("startTime"),
    endTime: form.get("endTime"),
  };
  appendEventFields(djangoForm, body);
  const image = form.get("image");
  if (image && typeof image !== "string" && image.size > 0) {
    djangoForm.append("image", image);
  }
  return djangoForm;
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const res = await djangoFetch(`/api/events/${id}/`, { token });
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(transformEvent(data));
  } catch (err) {
    console.error("[event GET] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const djangoForm = await buildDjangoFormFromRequest(req);
      const res = await djangoFetchMultipart(`/api/events/${id}/`, {
        method: "PATCH",
        formData: djangoForm,
        token,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Object.values(data)?.[0];
        return NextResponse.json(
          { error: Array.isArray(msg) ? msg[0] : data?.detail || "Update failed." },
          { status: res.status }
        );
      }
      return NextResponse.json(transformEvent(data));
    }

    const body = await req.json();

    if ("published" in body || "status" in body) {
      const target = body.status ?? (body.published ? "PUBLISHED" : "CANCELLED");
      let action;
      if (target === "PUBLISHED") action = "publish";
      else if (target === "DRAFT") action = "unpublish";
      else action = "cancel";
      const res = await djangoFetch(`/api/events/${id}/${action}/`, { method: "POST", token });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data?.detail || "Action failed." }, { status: res.status });
      return NextResponse.json(data);
    }

    const djangoBody = {};
    if (body.title !== undefined) djangoBody.title = body.title;
    if (body.description !== undefined) djangoBody.description = body.description;
    if (body.startTime !== undefined) djangoBody.start_time = body.startTime;
    if (body.endTime !== undefined) djangoBody.end_time = body.endTime;
    if (body.venue !== undefined) djangoBody.venue = body.venue;
    if (body.capacity !== undefined) djangoBody.capacity = body.capacity;

    const res = await djangoFetch(`/api/events/${id}/`, { method: "PATCH", body: djangoBody, token });
    const data = await res.json();
    if (!res.ok) {
      const msg = Object.values(data)?.[0];
      return NextResponse.json({ error: Array.isArray(msg) ? msg[0] : data?.detail || "Update failed." }, { status: res.status });
    }
    return NextResponse.json(transformEvent(data));
  } catch (err) {
    console.error("[event PUT] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  return PUT(req, { params });
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    const res = await djangoFetch(`/api/events/${id}/cancel/`, { method: "POST", token });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data?.detail || "Cancel failed." }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[event DELETE] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
