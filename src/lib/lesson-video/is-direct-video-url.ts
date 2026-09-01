/**
 * True when the URL points at a playable hosted mp4 (Storage / direct file),
 * not a YouTube/Vimeo embed used as a seed fallback.
 */
export function isDirectVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes("youtube.com/") ||
    lower.includes("youtu.be/") ||
    lower.includes("youtube-nocookie.com/") ||
    lower.includes("vimeo.com/")
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const path = parsed.pathname.toLowerCase();
    if (path.endsWith(".mp4")) return true;
    // Supabase public object URLs for lesson-videos bucket
    if (path.includes("/storage/v1/object/public/lesson-videos/")) return true;
    return false;
  } catch {
    return false;
  }
}
