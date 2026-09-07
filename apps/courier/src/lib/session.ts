import { useSyncExternalStore } from "react";

export type User = { id: number; name: string; email: string; role: string; merchant_id: number | null; courier_id: number | null };
export type CourierProfile = { id: number; name: string; email: string; phone: string | null; vehicle_type: string; home_fsa: string | null; status: string };
export type Session = { token: string; user: User; courier: CourierProfile | null };

const KEY = "handoff.courier.session";
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
const emit = () => listeners.forEach((l) => l());

export const getSession = () => current;

export function setSession(session: Session) {
  current = session;
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // memory only
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

export function useSession() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}
