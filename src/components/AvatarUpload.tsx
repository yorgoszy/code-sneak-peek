import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processAvatarImage } from "@/utils/imageProcessing";

interface AvatarUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (photoUrl: string | null) => void;
  disabled?: boolean;
  fallbackText?: string;
  size?: number;
}

export const AvatarUpload = ({
  currentPhotoUrl,
  onPhotoChange,
  disabled,
  fallbackText = "?",
  size = 96,
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Σφάλμα", description: "Παρακαλώ επιλέξτε μια έγκυρη εικόνα" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Σφάλμα", description: "Η εικόνα δεν μπορεί να είναι μεγαλύτερη από 10MB" });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const processed = await processAvatarImage(file);
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-photos")
        .upload(filePath, processed.blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("user-photos").getPublicUrl(filePath);
      if (data.publicUrl) {
        setPreviewUrl(data.publicUrl);
        onPhotoChange(data.publicUrl);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({ variant: "destructive", title: "Σφάλμα", description: "Δεν ήταν δυνατό το ανέβασμα" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onPhotoChange(null);
  };

  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <label
          htmlFor="avatar-upload-input"
          className={`block rounded-full overflow-hidden border-2 border-border cursor-pointer group ${
            disabled || uploading ? "pointer-events-none opacity-60" : ""
          }`}
          style={{ width: size, height: size }}
        >
          <Avatar className="w-full h-full">
            {previewUrl && <AvatarImage src={previewUrl} alt="avatar" className="object-cover" />}
            <AvatarFallback className="text-xl bg-muted">{fallbackText}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </label>

        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute -top-1 -right-1 h-7 w-7 bg-background border border-border rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <input
          id="avatar-upload-input"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={disabled || uploading}
          className="hidden"
        />
      </div>
    </div>
  );
};
