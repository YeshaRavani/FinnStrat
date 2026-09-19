const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

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
  return response.json() as Promise<T>;
}

export async function getJson<T>(path: string): Promise<T> {
  try {
    return await readResponse<T>(await fetch(`${API_BASE_URL}${path}`));
  } catch (cause) {
    if (cause instanceof TypeError) throw new Error(`Backend unavailable at ${API_BASE_URL}. Start FastAPI and retry.`);
    throw cause;
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  try {
    return await readResponse<T>(await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
  } catch (cause) {
    if (cause instanceof TypeError) throw new Error(`Backend unavailable at ${API_BASE_URL}. Start FastAPI and retry.`);
    throw cause;
  }
}
