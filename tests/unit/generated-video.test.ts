import { describe, expect, it } from "vitest";
import { mapGeneratedVideoRow } from "@/lib/generated-video/map-row";
import {
  callbackBaseUrl,
  verifyN8nSecret,
} from "@/lib/generated-video/n8n-config";

describe("generated video map-row", () => {
  it("maps a ready job row", () => {
    const mapped = mapGeneratedVideoRow({
      id: "00000000-0000-0000-0000-000000000001",
      lesson_id: "lesson-1",
      term_id: "term-1",
      week_id: "week-1",
      resource_id: "res-1",
      status: "ready",
      source_pdf_url: "https://example.com/a.pdf",
      page_image_urls: ["https://example.com/p1.jpg"],
      scenes: [
        {
          spokenScript: "E equals m c squared",
          pageImageUrl: "https://example.com/p1.jpg",
          latex: "$E=mc^2$",
        },
      ],
      heygen_video_id: "hg-1",
      video_url: "https://example.com/out.mp4",
      error: null,
      created_by: null,
      created_at: "2026-08-26T00:00:00.000Z",
      updated_at: "2026-08-26T00:00:00.000Z",
    });

    expect(mapped.lessonId).toBe("lesson-1");
    expect(mapped.status).toBe("ready");
    expect(mapped.videoUrl).toBe("https://example.com/out.mp4");
    expect(mapped.scenes?.[0]?.spokenScript).toContain("equals");
  });
});

describe("n8n secret gate", () => {
  it("rejects missing secret when env unset", () => {
    expect(verifyN8nSecret(null)).toBe(false);
    expect(verifyN8nSecret("anything")).toBe(false);
  });
});

describe("callbackBaseUrl", () => {
  it("uses x-forwarded-host and proto for a public host", () => {
    const req = new Request("http://localhost:3000/api/lessons/generate-video", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-host": "www.embermaths12.com",
        "x-forwarded-proto": "https",
      },
    });
    const result = callbackBaseUrl(req);
    expect(result).toEqual({ ok: true, baseUrl: "https://www.embermaths12.com" });
  });

  it("uses host header when no forwarded host", () => {
    const req = new Request("https://www.embermaths12.com/api/lessons/generate-video", {
      headers: {
        host: "www.embermaths12.com",
        "x-forwarded-proto": "https",
      },
    });
    const result = callbackBaseUrl(req);
    expect(result).toEqual({ ok: true, baseUrl: "https://www.embermaths12.com" });
  });

  it("rejects localhost Host and does not fall back to APP_URL", () => {
    const prev = process.env.APP_URL;
    process.env.APP_URL = "https://www.embermaths12.com";
    try {
      const req = new Request("http://localhost:3000/api/lessons/generate-video", {
        headers: { host: "localhost:3000" },
      });
      const result = callbackBaseUrl(req);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/cannot reach localhost/i);
      }
    } finally {
      if (prev === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = prev;
    }
  });

  it("rejects 127.0.0.1", () => {
    const req = new Request("http://127.0.0.1:3000/api/lessons/generate-video", {
      headers: { host: "127.0.0.1:3000" },
    });
    const result = callbackBaseUrl(req);
    expect(result.ok).toBe(false);
  });
});
