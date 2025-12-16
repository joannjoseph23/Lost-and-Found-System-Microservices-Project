// frontend/lib/auth.ts
export type Session = {
  token: string;
  username: string;
  role: "ADMIN" | "USER";
};

const KEY = "laf_session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function requireUser(): Session | null {
  const s = getSession();
  return s && s.role === "USER" ? s : null;
}

export function requireAdmin(): Session | null {
  const s = getSession();
  return s && s.role === "ADMIN" ? s : null;
}
