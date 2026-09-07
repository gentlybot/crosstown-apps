import { clearSession, getSession, type Merchant, type Session, type User } from "./session";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3200").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!(init.body instanceof FormData) && init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const session = getSession();
  if (session) headers.set("Authorization", `Bearer ${session.token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && session) {
    clearSession();
    window.location.assign("/login");
  }

  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: Record<string, string[]> } & T;
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`, data.errors);
  }
  return data;
}

export type BatchStatus = "importing" | "needs_review" | "ready" | "failed";

export type Batch = {
  id: number;
  name: string;
  status: BatchStatus;
  source: string;
  delivery_date: string;
  original_filename: string | null;
  row_count: number;
  ready_count: number;
  problem_count: number;
  error_message: string | null;
  imported_at: string | null;
  created_at: string;
  created_by: string | null;
};

export type Order = {
  id: number;
  row_number: number;
  external_id: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  address_line: string | null;
  unit: string | null;
  city: string | null;
  postal_code: string | null;
  full_address: string;
  notes: string | null;
  quantity: number;
  leave_at_door: boolean;
  status: "pending" | "problem" | "ready";
  problems: string[];
};

export type BatchDetail = Batch & { orders: Order[] };

export const api = {
  signIn(email: string, password: string) {
    return request<Session>("/api/v1/session", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  signOut() {
    return request<void>("/api/v1/session", { method: "DELETE" });
  },
  me() {
    return request<{ user: User; merchant: Merchant | null }>("/api/v1/me");
  },
  listBatches() {
    return request<{ batches: Batch[] }>("/api/v1/merchant/batches").then((r) => r.batches);
  },
  getBatch(id: number | string) {
    return request<{ batch: BatchDetail }>(`/api/v1/merchant/batches/${id}`).then((r) => r.batch);
  },
  createBatch(input: { file: File; delivery_date?: string; name?: string }) {
    const body = new FormData();
    body.append("file", input.file);
    if (input.delivery_date) body.append("delivery_date", input.delivery_date);
    if (input.name) body.append("name", input.name);
    return request<{ batch: Batch }>("/api/v1/merchant/batches", { method: "POST", body }).then((r) => r.batch);
  },
};
