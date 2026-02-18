const getApiKey = () => localStorage.getItem('smartstats-api-key') || '';

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const apiKey = getApiKey();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
