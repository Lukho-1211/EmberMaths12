import { createClient } from "@/lib/supabase/client";

function isMissingObjectError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("not found") ||
    lower.includes("does not exist") ||
    lower.includes("404") ||
    lower.includes("object not found")
  );
}

function isAlreadyExistsError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("already exists") ||
    lower.includes("duplicate") ||
    lower.includes("resource already exists")
  );
}

/**
 * Upload an mp4 (or other allowed asset) to the lesson-videos bucket (admin client).
 * Uses update-or-insert instead of upsert to avoid Storage RLS failures on replace.
 */
export async function uploadLessonVideoAsset(
  file: Blob,
  path: string,
  contentType: string,
): Promise<{ url: string; path: string } | { error: string }> {
  const supabase = createClient();
  const bucket = supabase.storage.from("lesson-videos");

  // Prefer update when the object already exists (replace path). Upsert uses
  // INSERT ON CONFLICT which can fail RLS even when UPDATE/INSERT policies exist.
  const updated = await bucket.update(path, file, { contentType });
  if (!updated.error) {
    const { data } = bucket.getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  const inserted = await bucket.upload(path, file, {
    upsert: false,
    contentType,
  });
  if (!inserted.error) {
    const { data } = bucket.getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  if (isAlreadyExistsError(inserted.error.message)) {
    const retry = await bucket.update(path, file, { contentType });
    if (retry.error) return { error: retry.error.message };
    const { data } = bucket.getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  return {
    error: isMissingObjectError(updated.error.message)
      ? inserted.error.message
      : updated.error.message,
  };
}

/** Remove a Storage object from the lesson-videos bucket (admin client). */
export async function deleteLessonVideoAsset(
  path: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient();
  const { error } = await supabase.storage.from("lesson-videos").remove([path]);
  if (error) return { error: error.message };
  return { ok: true };
}
