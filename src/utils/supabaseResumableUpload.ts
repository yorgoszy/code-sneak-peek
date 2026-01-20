import * as tus from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";

// Public project configuration (anon key is safe to ship to browser)
const SUPABASE_URL = "https://dicwdviufetibnafzipa.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8";

type ResumableUploadParams = {
  bucket: string;
  objectName: string;
  file: File;
  cacheControl?: string;
  upsert?: boolean;
  chunkSize?: number;
  onProgress?: (percent: number) => void;
};

export async function uploadToSupabaseResumable({
  bucket,
  objectName,
  file,
  cacheControl = "3600",
  upsert = false,
  chunkSize = 6 * 1024 * 1024,
  onProgress,
}: ResumableUploadParams): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
        "x-upsert": upsert ? "true" : "false",
      },
      metadata: {
        bucketName: bucket,
        objectName,
        contentType: file.type || "application/octet-stream",
        cacheControl,
      },
      chunkSize,
      removeFingerprintOnSuccess: true,
      uploadDataDuringCreation: true,
      onError: (err) => reject(err),
      onProgress: (bytesUploaded, bytesTotal) => {
        if (!bytesTotal) return;
        const percent = Math.round((bytesUploaded / bytesTotal) * 100);
        onProgress?.(percent);
      },
      onSuccess: () => resolve(),
    });

    upload.start();
  });
}
