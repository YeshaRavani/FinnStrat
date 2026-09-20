const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
const TOKEN_KEY = "finnstrat.access_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseBody = await response.text();
    let detail = responseBody;
    try {
      const parsed = JSON.parse(responseBody) as { detail?: unknown };
      if (typeof parsed.detail === "string") detail = parsed.detail;
      else if (parsed.detail !== undefined) detail = JSON.stringify(parsed.detail);
    } catch {
      // Keep the response text when the server did not return JSON.
    }
    throw new Error(detail ? `API request failed (${response.status}): ${detail}` : `API request failed with status ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getJson<T>(path: string): Promise<T> {
  try {
    return await readResponse<T>(await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() }));
  } catch (cause) {
    if (cause instanceof TypeError) throw new Error(`Backend unavailable at ${API_BASE_URL}. Start FastAPI and retry.`);
    throw cause;
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  try {
    return await readResponse<T>(await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }));
  } catch (cause) {
    if (cause instanceof TypeError) throw new Error(`Backend unavailable at ${API_BASE_URL}. Start FastAPI and retry.`);
    throw cause;
  }
}

export async function putJson<T>(path: string, body: unknown): Promise<T> {
  try {
    return await readResponse<T>(await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }));
  } catch (cause) {
    if (cause instanceof TypeError) throw new Error(`Backend unavailable at ${API_BASE_URL}. Start FastAPI and retry.`);
    throw cause;
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
