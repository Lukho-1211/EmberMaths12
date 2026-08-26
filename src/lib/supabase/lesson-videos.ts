import { createClient } from "@/lib/supabase/client";

/**
 * Upload a JPEG/PNG page image to the lesson-videos bucket (admin client).
 */
export async function uploadLessonVideoAsset(
  file: Blob,
  path: string,
  contentType: string,
): Promise<{ url: string; path: string } | { error: string }> {
  const supabase = createClient();
  const { error } = await supabase.storage.from("lesson-videos").upload(path, file, {
    upsert: true,
    contentType,
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("lesson-videos").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
