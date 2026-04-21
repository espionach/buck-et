import { supabase } from "@/integrations/supabase/client";

const sanitizeFilename = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9._-]/g, "-").slice(-60);

const uniqueName = (file: File) => {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${base}.${ext}`;
};

/**
 * Upload a profile picture to the public `avatars` bucket.
 * Returns a public URL.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `${userId}/${uniqueName(file)}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload one or more sidequest photos/videos to the private `sidequest-photos` bucket.
 * Returns the storage paths (used to build signed URLs later).
 */
export async function uploadSidequestPhotos(
  sidequestId: string,
  files: File[]
): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const path = `${sidequestId}/${uniqueName(file)}`;
    const { error } = await supabase.storage
      .from("sidequest-photos")
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

/**
 * Convert a stored sidequest photo path into a temporary signed URL the
 * browser can render. Returns null if the user is not allowed to view it.
 */
export async function getSidequestPhotoUrl(
  pathOrUrl: string,
  expiresInSec = 3600
): Promise<string | null> {
  // Backward-compat: legacy entries are full data: URLs or http(s) URLs.
  if (
    pathOrUrl.startsWith("data:") ||
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("blob:")
  ) {
    return pathOrUrl;
  }
  const { data, error } = await supabase.storage
    .from("sidequest-photos")
    .createSignedUrl(pathOrUrl, expiresInSec);
  if (error) return null;
  return data.signedUrl;
}

/**
 * Resolve many sidequest-photo paths to signed URLs in parallel.
 */
export async function getSidequestPhotoUrls(
  paths: string[],
  expiresInSec = 3600
): Promise<string[]> {
  const urls = await Promise.all(paths.map((p) => getSidequestPhotoUrl(p, expiresInSec)));
  return urls.filter((u): u is string => !!u);
}
