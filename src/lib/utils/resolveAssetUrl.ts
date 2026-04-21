const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

/**
 * Resolve any asset URL to an absolute production URL.
 * - Relative paths  (/uploads/...)       → prepend API_URL
 * - Stale localhost (http://localhost:X/…) → replace origin with API_URL
 * - Already-absolute non-localhost URLs  → unchanged (Cloudinary, etc.)
 */
export function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  try {
    const { hostname, pathname, search } = new URL(url);
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${API_URL}${pathname}${search}`;
    }
  } catch {
    // not a valid absolute URL — return as-is
  }
  return url;
}
