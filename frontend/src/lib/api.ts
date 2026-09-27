let csrfToken = "";

export function setCsrfToken(token: string) { csrfToken = token; }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (csrfToken && method !== "GET" && method !== "HEAD") headers.set("X-CSRF-Token", csrfToken);
  const response = await fetch(`/api/v1${path}`, { ...options, headers, credentials: "same-origin", cache: "no-store" });
  if (response.status === 401 && path !== "/auth/login") {
    setCsrfToken("");
    window.location.reload();
    throw new Error("Sessiya tugadi. Qayta kiring.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `So‘rov bajarilmadi (${response.status}).`);
  }
  return response.status === 204 ? null as T : response.json() as Promise<T>;
}

export function jsonBody(payload: unknown): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
}
