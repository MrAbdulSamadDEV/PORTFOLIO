/** Typed JSON fetching with a small in-memory cache. */

const cache = new Map<string, Promise<unknown>>();

export function fetchJson<T>(url: string, force = false): Promise<T> {
  if (!force) {
    const cached = cache.get(url);
    if (cached) return cached as Promise<T>;
  }

  const promise = fetch(url, { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
      }
      return response.json() as Promise<T>;
    })
    .catch((error: unknown) => {
      cache.delete(url);
      throw error;
    });

  cache.set(url, promise);
  return promise;
}
