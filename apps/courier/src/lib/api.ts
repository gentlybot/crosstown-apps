import { clearSession, getSession, type Session } from "./session";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3200").replace(/\/$/, "");
const BASE = import.meta.env.BASE_URL;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  const session = getSession();
  if (session) headers.set("Authorization", `Bearer ${session.token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401 && session) {
    clearSession();
    window.location.assign(`${BASE}login`);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  return data;
}

export type RouteStatus = "planned" | "offered" | "assigned" | "in_progress" | "completed" | "cancelled";
export type StopStatus = "pending" | "delivered" | "failed";
export type FailureReason = "no_answer" | "wrong_address" | "refused" | "unsafe_to_leave" | "other";
export const FAILURE_REASONS: { value: FailureReason; label: string }[] = [
  { value: "no_answer", label: "No answer and no leave-at-door" },
  { value: "wrong_address", label: "Address was wrong" },
  { value: "refused", label: "Recipient refused it" },
  { value: "unsafe_to_leave", label: "Not safe to leave" },
  { value: "other", label: "Something else" },
];

export type MerchantBrief = {
  id: number;
  business_name: string;
  slug: string;
  cutoff_time: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
};

export type Availability = { availability_dates: string[] };

export type PayLine = { label: string; cents: number };

export type CourierStop = {
  id: number;
  position: number;
  order_id: number;
  batch_id: number;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  address: string;
  unit: string | null;
  notes: string | null;
  quantity: number;
  leave_at_door: boolean;
  lat: number;
  lng: number;
  leg_km: number;
  eta: string;
  status: StopStatus;
  completed_at: string | null;
  failure_reason: FailureReason | null;
  note: string | null;
  has_photo: boolean;
};

export type RouteSummary = {
  id: number;
  route_number: number;
  display_name: string;
  status: RouteStatus;
  engine: string;
  delivery_date: string;
  stop_count: number;
  distance_km: number;
  duration_minutes: number;
  start_at: string;
  start_lat: number;
  start_lng: number;
  pay_cents: number;
  delivered_count: number;
  failed_count: number;
  merchant: MerchantBrief;
  pay_breakdown: PayLine[];
};

export type CourierRoute = RouteSummary & {
  started_at: string | null;
  completed_at: string | null;
  stops: CourierStop[];
};

export type Offer = {
  id: number;
  status: string;
  pay_cents: number;
  offered_at: string;
  expires_at: string;
  route: RouteSummary & { first_stop_fsa: string | null };
};

export const api = {
  signIn(email: string, password: string) {
    return request<Session>("/api/v1/session", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  signOut() {
    return request<void>("/api/v1/session", { method: "DELETE" });
  },
  offers: {
    list: () => request<{ offers: Offer[] }>("/api/v1/courier/offers").then((r) => r.offers),
    accept: (id: number) => request<{ route: CourierRoute }>(`/api/v1/courier/offers/${id}/accept`, { method: "POST", body: "{}" }).then((r) => r.route),
    decline: (id: number) => request<void>(`/api/v1/courier/offers/${id}/decline`, { method: "POST", body: "{}" }),
  },
  availability: {
    get: (from: string, to: string) => request<Availability>(`/api/v1/courier/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    set: (date: string, available: boolean) => request<{ date: string; available: boolean }>("/api/v1/courier/availability", { method: "PATCH", body: JSON.stringify({ date, available }) }),
  },
  routes: {
    list: () => request<{ routes: CourierRoute[] }>("/api/v1/courier/routes").then((r) => r.routes),
    get: (id: string | number) => request<{ route: CourierRoute }>(`/api/v1/courier/routes/${id}`).then((r) => r.route),
    start: (id: number) => request<{ route: CourierRoute }>(`/api/v1/courier/routes/${id}/start`, { method: "POST", body: "{}" }).then((r) => r.route),
    completeStop: (routeId: number, stopId: number, input: { status: "delivered" | "failed"; note?: string; failure_reason?: FailureReason; photo?: string | null }) =>
      request<{ route: CourierRoute }>(`/api/v1/courier/routes/${routeId}/stops/${stopId}`, { method: "PATCH", body: JSON.stringify(input) }).then((r) => r.route),
  },
};
