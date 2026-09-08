import { createClient } from "@/lib/supabase/client";

/** Soft cap matching the student-scans bucket (20 MB). */
export const MAX_STUDENT_SCAN_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

function mimeFromFile(file: File): string | null {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".pdf")) return "application/pdf";
  return null;
}

/**
 * Upload a student paper scan to the private `student-scans` bucket.
 * Path: `{studentId}/{assessmentId}/{uuid}-{safeName}` — no public URL.
 */
export async function uploadStudentScan(args: {
  studentId: string;
  assessmentId: string;
  file: File;
}): Promise<{ path: string; fileName: string } | { error: string }> {
  const { studentId, assessmentId, file } = args;
  if (!studentId || !assessmentId) {
    return { error: "Missing student or assessment id." };
  }
  if (file.size > MAX_STUDENT_SCAN_BYTES) {
    return { error: "File is too large (max 20 MB)." };
  }
  const contentType = mimeFromFile(file);
  if (!contentType) {
    return { error: "Only JPEG, PNG, WebP, HEIC, or PDF scans are supported." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${studentId}/${assessmentId}/${crypto.randomUUID()}-${safeName}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("student-scans").upload(path, file, {
    upsert: false,
    contentType,
  });
  if (error) return { error: error.message };
  return { path, fileName: file.name };
}
