import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export const PromoVideoUploader: React.FC<Props> = ({ value, onChange }) => {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast.error('Μέγιστο μέγεθος 200MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const path = `promo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('promo-video')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('promo-video').getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success('Το βίντεο ανέβηκε!');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Σφάλμα ανεβάσματος');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">Promo Video (YouTube URL ή ανέβασμα αρχείου)</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://youtube.com/... ή URL αρχείου"
        className="rounded-none"
      />
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {uploading ? 'Ανέβασμα...' : 'Ανέβασε MP4'}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="rounded-none" onClick={() => onChange('')}>
            Καθάρισμα
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Μπορείς να βάλεις YouTube link ή να ανεβάσεις απευθείας ένα MP4 (έως 200MB).
      </p>
    </div>
  );
};
