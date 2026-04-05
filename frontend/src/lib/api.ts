const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/dre_token=([^;]+)/);
  return match ? match[1] : null;
}

export function getTokenPayload(): { sub: string; is_admin: boolean } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { sub: payload.sub, is_admin: Boolean(payload.is_admin) };
  } catch {
    return null;
  }
}

export function getUsername(): string | null {
  return getTokenPayload()?.sub ?? null;
}

export function isAdmin(): boolean {
  return getTokenPayload()?.is_admin ?? false;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ${res.status}`);
  }
  return res.json();
}
