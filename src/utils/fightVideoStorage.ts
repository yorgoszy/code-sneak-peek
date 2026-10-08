import { supabase } from "@/integrations/supabase/client";
import { uploadToSupabaseResumable } from "@/utils/supabaseResumableUpload";

export const FIGHT_VIDEO_BUCKET = "fight-videos";
const PREFIX = `storage://${FIGHT_VIDEO_BUCKET}/`;

export const isStoredFightVideo = (url?: string | null) => !!url && url.startsWith(PREFIX);

export const uploadFightVideo = async (
  fightId: string,
  file: File,
  onProgress?: (p: number) => void
): Promise<string> => {
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
  const objectName = `${fightId}/${Date.now()}.${ext}`;
  await uploadToSupabaseResumable({
    bucket: FIGHT_VIDEO_BUCKET,
    objectName,
    file,
    upsert: true,
    onProgress,
  });
  return `${PREFIX}${objectName}`;
};

/** Returns a playable URL (signed for stored videos, as-is otherwise). */
export const resolveFightVideoUrl = async (url?: string | null): Promise<string | null> => {
  if (!url) return null;
  if (!isStoredFightVideo(url)) return url;
  const path = url.slice(PREFIX.length);
  const { data, error } = await supabase.storage
    .from(FIGHT_VIDEO_BUCKET)
    .createSignedUrl(path, 60 * 60 * 6);
  if (error) {
    console.error("Signed URL error:", error);
    return null;
  }
  return data.signedUrl;
};
