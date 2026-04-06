import { API_BASE } from "../config/client";

export async function apiFetch(path, options = {}, token) {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!(options.body instanceof FormData) && !headers["Content-Type"] && options.body) {
        headers["Content-Type"] = "application/json";
    }

    // Auto-prepend /api
    const fullPath = path.startsWith("/api") ? path : `/api${path}`;

    const response = await fetch(`${API_BASE}${fullPath}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Request failed.");
    return data;
}