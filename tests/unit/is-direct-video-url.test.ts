import { describe, expect, it } from "vitest";
import { isDirectVideoUrl } from "@/lib/lesson-video/is-direct-video-url";

describe("isDirectVideoUrl", () => {
  it("accepts Storage public mp4 URLs", () => {
    expect(
      isDirectVideoUrl(
        "https://xyz.supabase.co/storage/v1/object/public/lesson-videos/lesson-1/lesson.mp4",
      ),
    ).toBe(true);
  });

  it("accepts any https .mp4 path", () => {
    expect(isDirectVideoUrl("https://cdn.example.com/videos/intro.mp4")).toBe(true);
  });

  it("accepts lesson-videos bucket paths without .mp4 suffix", () => {
    expect(
      isDirectVideoUrl(
        "https://xyz.supabase.co/storage/v1/object/public/lesson-videos/abc/lesson.mp4?t=1",
      ),
    ).toBe(true);
  });

  it("rejects YouTube embeds", () => {
    expect(isDirectVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(false);
    expect(isDirectVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(false);
  });

  it("rejects empty and invalid values", () => {
    expect(isDirectVideoUrl(null)).toBe(false);
    expect(isDirectVideoUrl(undefined)).toBe(false);
    expect(isDirectVideoUrl("")).toBe(false);
    expect(isDirectVideoUrl("   ")).toBe(false);
    expect(isDirectVideoUrl("not-a-url")).toBe(false);
  });
});
