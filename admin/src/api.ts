const TOKEN_KEY = "qaari_admin_token";
const USER_KEY = "qaari_admin_user";

export type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  role: "admin";
};

export type Recording = {
  id: string;
  juzNumber: number;
  durationSeconds: number | null;
  audioUrl: string;
};

export type Qaari = {
  id: string;
  name: string;
  bio: string;
  photoUrl: string | null;
  uploadedJuzCount: number;
  favoriteCount?: number;
  createdAt?: string;
  recordings?: Recording[];
};

export type Stats = {
  userCount: number;
  qaariCount: number;
  recordingCount: number;
  favoriteCount: number;
  completeCount: number;
  pendingJuz: number;
  mostFavorited: { qaariId: string; name: string; favorites: number }[];
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function setSession(token: string | null, user?: AdminUser | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (!token) localStorage.removeItem(USER_KEY);
}

export function setToken(token: string | null) {
  setSession(token);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Something went wrong");
  }
  return data as T;
}

export const api = {
  login: (identifier: string, password: string) =>
    request<{ token: string; user: AdminUser }>("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
  me: () => request<{ user: AdminUser }>("/auth/me"),
  stats: () => request<{ stats: Stats }>("/admin/stats"),
  qaaris: () => request<{ qaaris: Qaari[] }>("/admin/qaaris"),
  qaari: (id: string) => request<{ qaari: Qaari }>(`/admin/qaaris/${id}`),
  createQaari: (form: FormData) =>
    request<{ qaari: Qaari }>("/admin/qaaris", { method: "POST", body: form }),
  updateQaari: (id: string, form: FormData) =>
    request<{ qaari: Qaari }>(`/admin/qaaris/${id}`, { method: "PUT", body: form }),
  deleteQaari: (id: string) => request<void>(`/admin/qaaris/${id}`, { method: "DELETE" }),
  uploadJuz: (qaariId: string, form: FormData) =>
    request<{ recording: Recording }>(`/admin/qaaris/${qaariId}/juz`, {
      method: "POST",
      body: form,
    }),
  deleteRecording: (id: string) =>
    request<void>(`/admin/recordings/${id}`, { method: "DELETE" }),
};
