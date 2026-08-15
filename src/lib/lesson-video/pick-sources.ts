import type { Resource } from "@/lib/types";

function isUploadedUrl(url: string) {
  return (
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}

/** Uploaded PDF / Markdown resources that can become a video walkthrough. */
export function pickVideoSources(resources: Resource[]): Resource[] {
  return resources.filter(
    (r) => (r.type === "pdf" || r.type === "markdown") && isUploadedUrl(r.url),
  );
}

export function hasVideoSources(resources: Resource[]): boolean {
  return pickVideoSources(resources).length > 0;
}
