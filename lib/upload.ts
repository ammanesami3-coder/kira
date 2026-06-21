import { createClient } from "@/lib/supabase/client";

/**
 * Client-side upload of a car image to the public `car-images` bucket.
 *
 * Runs with the authenticated owner's browser session, so the Storage RLS
 * policy (only `authenticated` may write to this bucket) is enforced. Returns
 * the public URL + the object path; the path is then recorded in `car_images`
 * via the `addCarImages` Server Action and reused to delete the object later.
 */
const BUCKET = "car-images";

export interface UploadedImage {
  url: string;
  storage_path: string;
}

export async function uploadCarImage(
  file: File,
  carId: string,
): Promise<UploadedImage> {
  const supabase = createClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${carId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, storage_path: path };
}
