/**
 * Normalizes any image URL to a fully usable path.
 *
 * Handles three cases:
 *  1. Already correct:   /api/uploads/foo.png  → /api/uploads/foo.png
 *  2. Missing /api prefix: /uploads/foo.png    → /api/uploads/foo.png
 *  3. Absolute external URL                    → returned as-is (fallback)
 *  4. null / empty                             → null
 */
export function fixImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/api/uploads/")) return url;
  if (url.startsWith("/uploads/")) return `/api${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return url;
  return null;
}
