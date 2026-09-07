import { useSyncExternalStore } from "react";

export type User = {
  id: number;
  name: string;
  email: string;
  role: "merchant_admin" | "merchant_staff" | "admin";
  merchant_id: number | null;
};

export type Merchant = {
  id: number;
  business_name: string;
  slug: string;
  contact_name: string | null;
  contact_email: string;
  phone: string | null;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  cutoff_time: string;
  timezone: string;
};

export type Session = { token: string; user: User; merchant: Merchant | null };

const KEY = "handoff.session";
const listeners = new Set<() => void>();

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

let current: Session | null = read();

function emit() {
  for (const l of listeners) l();
}

export function getSession(): Session | null {
  return current;
}

export function setSession(session: Session) {
  current = session;
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Private mode or blocked storage: the session lives in memory only.
  }
  emit();
}

export function clearSession() {
  current = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  emit();
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}

/** Where a signed-in user lands. */
export function homeFor(session: Session | null): "/admin/batches" | "/merchant/batches" | "/login" {
  if (!session) return "/login";
  return session.user.role === "admin" ? "/admin/batches" : "/merchant/batches";
}
