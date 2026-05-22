const DJANGO_URL = process.env.DJANGO_API_URL || "";

if (!DJANGO_URL && typeof window === "undefined") {
  // Server-side only — log once at startup so it's visible in Vercel logs
  console.warn(
    "[djangoApi] DJANGO_API_URL is not set. " +
    "Add it to your Vercel project environment variables: " +
    "DJANGO_API_URL=https://your-backend.onrender.com"
  );
}

export async function djangoFetch(path, { method = "GET", body, token, headers: extra = {} } = {}) {
  const base = DJANGO_URL || "http://localhost:8000";
  const headers = { "Content-Type": "application/json", ...extra };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return fetch(`${base}${path}`, opts);
}

/** Multipart upload (e.g. event image). Do not set Content-Type — fetch sets boundary. */
export async function djangoFetchMultipart(path, { method = "POST", formData, token } = {}) {
  const base = DJANGO_URL || "http://localhost:8000";
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${base}${path}`, { method, headers, body: formData });
}

export function getTokenFromRequest(req) {
  return req.cookies.get("access_token")?.value || null;
}

// ─── Response Transformers ────────────────────────────────────────────────────

export function transformTier(t) {
  if (!t) return null;
  return {
    id: t.id,
    eventId: t.event_id,
    name: t.tier_name,
    price: parseFloat(t.price),
    quantity: t.quantity_total,
    remaining: t.quantity_remaining ?? t.quantity_total - (t.quantity_sold || 0),
    sold: t.quantity_sold || 0,
  };
}

export function transformSession(s) {
  if (!s) return null;
  return {
    id: s.id,
    eventId: s.event_id,
    title: s.title,
    speaker: s.speaker || "",
    startTime: s.start_time,
    duration: s.duration_minutes,
  };
}

/** Full event detail (EventDetailSerializer) */
export function transformEvent(e) {
  if (!e) return null;
  return {
    id: e.id,
    title: e.title,
    description: e.description || "",
    startTime: e.start_time,
    endTime: e.end_time,
    venue: e.venue,
    capacity: e.capacity,
    status: e.status,
    published: e.status === "PUBLISHED",
    organizerId: e.organizer_id,
    organizer: { id: e.organizer_id, name: e.organizer || "" },
    ticketTiers: (e.ticket_tiers || []).map(transformTier),
    agendaSessions: (e.sessions || []).map(transformSession),
    imageUrl: e.image_url || null,
    imageThumbnailUrl: e.image_thumbnail_url || e.image_url || null,
    _count: {
      registrations:
        e.registrations_count ??
        (e.ticket_tiers || []).reduce((s, t) => s + (t.quantity_sold || 0), 0),
    },
  };
}

/** List event (EventListSerializer — cheapest tier is a single object, not array) */
export function transformEventList(e) {
  const t = e.ticket_tiers;
  const sold = t?.quantity_sold ?? 0;
  const remaining = t?.quantity_remaining ?? 0;
  const tiers = t
    ? [{
        id: null,
        name: t.tier_name,
        price: parseFloat(t.price),
        sold,
        remaining,
        quantity: remaining + sold,
      }]
    : [];
  return {
    id: e.id,
    title: e.title,
    description: e.description || "",
    startTime: e.start_time,
    endTime: e.end_time,
    createdAt: e.created_at,
    venue: e.venue,
    capacity: e.capacity,
    status: e.status,
    published: e.status === "PUBLISHED",
    organizer: { name: e.organizer || "" },
    ticketTiers: tiers,
    imageUrl: e.image_url || null,
    _count: { registrations: e.registrations_count ?? 0 },
  };
}

export function transformUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role,
    suspended: !u.is_active,
    createdAt: u.created_at,
  };
}

/** Analytics: map Django response → component expectations */
export function transformAnalytics(a, capacity = 0) {
  const ticketsSold = a.tickets_sold || 0;
  const checkInRate = a.check_in_rate || 0;
  const checkedIn = Math.round(ticketsSold * checkInRate);
  const tierBreakdown = Object.fromEntries(
    (a.registrations_by_tier || []).map((r) => [r.tier_name, r.count])
  );
  return {
    ticketsSold,
    revenue: parseFloat(a.revenue || 0),
    checkinRate: Math.round(checkInRate * 100),
    checkedIn,
    avgRating: a.average_rating,
    feedbackCount: 0,
    tierBreakdown,
    dailySales: {},
    capacity,
  };
}

/** Attendee registration row (used for attendees list) */
export function transformRegistration(r) {
  if (!r) return null;
  return {
    id: r.id,
    attendeeId: r.attendee_id,
    ticketTierId: r.ticket_tier_id,
    status: r.status,
    qrCode: r.qr_code,
    registeredAt: r.registered_at,
  };
}

/** Attendee's own registration (My Events page) */
export function transformMyRegistration(r) {
  if (!r) return null;
  const event = r.event || {};
  const tier = r.ticket_tier || {};
  const payment = r.payment
    ? {
        amount: parseFloat(r.payment.amount),
        status: r.payment.status,
        paidAt: r.payment.paid_at,
      }
    : null;
  return {
    id: r.id,
    status: r.status,
    qrCode: r.qr_code || "",
    registeredAt: r.registered_at,
    canCancel: Boolean(r.can_cancel),
    canRefund: Boolean(r.can_refund),
    event: {
      id: event.id,
      title: event.title,
      venue: event.venue,
      startTime: event.start_time,
      endTime: event.end_time,
      status: event.status,
    },
    ticketTier: {
      id: tier.id,
      name: tier.tier_name,
      price: parseFloat(tier.price || 0),
    },
    payment,
  };
}
