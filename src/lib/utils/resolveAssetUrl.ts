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
    // not a valid absolute URL  return as-is
  }
  return url;
}

/**
 * Build a URL through the backend's `/api/files/download/*` route for a file
 * stored under `/uploads/...` (e.g. lesson documents). That route sets
 * `Content-Disposition: inline` or `attachment` correctly per file type.
 * Non-`/uploads/` URLs (e.g. Cloudinary) are returned unchanged since that
 * route can't serve them.
 */
function toFilesRouteUrl(url: string, inline: boolean): string {
  if (!url) return url;
  const absolute = resolveAssetUrl(url);
  const marker = '/uploads/';
  const idx = absolute.indexOf(marker);
  if (idx === -1) return absolute;
  const pathAfterUploads = absolute.slice(idx + marker.length);
  return `${API_URL}/api/files/download/${pathAfterUploads}${inline ? '?inline=true' : ''}`;
}

/** URL for viewing a lesson document (e.g. a PDF) inline on the platform. */
export function toFileViewUrl(url: string): string {
  return toFilesRouteUrl(url, true);
}

/** URL that forces a full download of the original file. */
export function toFileDownloadUrl(url: string): string {
  return toFilesRouteUrl(url, false);
}
