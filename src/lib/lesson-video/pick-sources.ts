import type { Resource } from "@/lib/types";

/** Uploaded PDF / Markdown resources that can become a video walkthrough. */
export function pickVideoSources(resources: Resource[]): Resource[] {
  return resources.filter(
    (r) =>
      (r.type === "pdf" || r.type === "markdown") && r.url.startsWith("data:"),
  );
}

export function hasVideoSources(resources: Resource[]): boolean {
  return pickVideoSources(resources).length > 0;
}
