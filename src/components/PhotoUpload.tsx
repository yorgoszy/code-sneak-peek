
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processAvatarImage } from "@/utils/imageProcessing";

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (photoUrl: string | null) => void;
  disabled?: boolean;
}

export const PhotoUpload = ({ currentPhotoUrl, onPhotoChange, disabled }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε μια έγκυρη εικόνα",
      });
      return;
    }

    // Validate file size (max 10MB for original - will be compressed)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Η εικόνα δεν μπορεί να είναι μεγαλύτερη από 10MB",
      });
      return;
    }

    setUploading(true);

    try {
      // Process the image (crop to square, resize, compress)
      const processed = await processAvatarImage(file);
      
      // Create a unique filename
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.jpg`;
      const filePath = `users/${fileName}`;

      // Upload processed file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(filePath, processed.blob, { contentType: 'image/jpeg' });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('user-photos')
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        setPreviewUrl(data.publicUrl);
        onPhotoChange(data.publicUrl);
        toast({
          title: "Επιτυχία",
          description: "Η φωτογραφία ανέβηκε επιτυχώς",
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατό το ανέβασμα της φωτογραφίας",
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    onPhotoChange(null);
  };

  return (
    <div className="space-y-2">
      <Label>Φωτογραφία</Label>
      
      {previewUrl ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-20 h-20 object-cover border rounded"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0"
              onClick={handleRemovePhoto}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">Επιλέξτε μια φωτογραφία</p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={disabled || uploading}
          className="hidden"
          id="photo-upload"
        />
        <Label htmlFor="photo-upload" className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none"
            disabled={disabled || uploading}
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Ανέβασμα..." : previewUrl ? "Αλλαγή" : "Επιλογή"}
            </span>
          </Button>
        </Label>
      </div>
      
      <p className="text-xs text-gray-500">
        Υποστηριζόμενες μορφές: JPG, PNG, GIF. Μέγιστο μέγεθος: 5MB
      </p>
    </div>
  );
};
