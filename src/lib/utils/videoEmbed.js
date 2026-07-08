// Shared helpers for detecting and embedding YouTube/Vimeo links,
// used for both slide videos and lesson/module resource materials.

export function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] || null;
}

export function getVimeoId(url) {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] || null;
}

export function isEmbeddableVideoUrl(url) {
  if (!url) return false;
  return Boolean(getYouTubeId(url) || getVimeoId(url));
}

// Returns an iframe-ready embed URL for YouTube/Vimeo links, or null if not applicable.
export function getVideoEmbedUrl(url) {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}`;

  const vimeoId = getVimeoId(url);
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;

  return null;
}
