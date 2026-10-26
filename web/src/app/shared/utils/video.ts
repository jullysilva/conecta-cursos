import type { VideoProvider } from '../../core/models/models';

/** Accepts either a raw id or a full URL and returns the provider's video id. */
export function extractVideoId(provider: VideoProvider, ref: string): string {
  const value = ref.trim();
  if (provider === 'YOUTUBE') {
    const match = value.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return match?.[1] ?? value;
  }
  if (provider === 'VIMEO') {
    return value.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] ?? value;
  }
  return value;
}

/** Embed URL for iframe-based providers; null for direct video files. */
export function embedUrl(provider: VideoProvider, ref: string, startAt = 0): string | null {
  const id = extractVideoId(provider, ref);
  if (!id) return null;
  const start = Math.floor(startAt);
  switch (provider) {
    case 'YOUTUBE':
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&start=${start}`;
    case 'VIMEO':
      return `https://player.vimeo.com/video/${id}#t=${start}s`;
    case 'PANDA':
      // Panda uses a per-account player domain, so the full embed URL is stored.
      return id.startsWith('https://') ? id : null;
    default:
      return null;
  }
}
