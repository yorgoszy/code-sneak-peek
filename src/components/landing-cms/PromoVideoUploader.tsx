import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SingleProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (url: string) => void;
}

const SingleUploader: React.FC<SingleProps> = ({ label, placeholder, value, onChange }) => {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const path = `promo-${Date.now()}.${ext}`;

      // Use resumable upload (tus) for large files (no 50MB edge limit)
      const { uploadToSupabaseResumable } = await import('@/utils/supabaseResumableUpload');
      await uploadToSupabaseResumable({
        bucket: 'promo-video',
        objectName: path,
        file,
        upsert: false,
        onProgress: (p) => setProgress(p),
      });

      const { data, error: signErr } = await supabase.storage
        .from('promo-video')
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !data?.signedUrl) throw signErr || new Error('Signed URL failed');
      onChange(data.signedUrl);
      toast.success('Το βίντεο ανέβηκε!');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Σφάλμα ανεβάσματος');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2 border border-border p-3">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-none"
      />
      <div className="flex gap-2 items-center">
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
          {uploading ? `Ανέβασμα... ${progress}%` : 'Ανέβασε βίντεο'}
        </Button>
        {value && !uploading && (
          <Button type="button" variant="ghost" size="sm" className="rounded-none" onClick={() => onChange('')}>
            Καθάρισμα
          </Button>
        )}
      </div>
    </div>
  );
};

interface Props {
  value: string;
  onChange: (url: string) => void;
  valueMobile: string;
  onChangeMobile: (url: string) => void;
}

export const PromoVideoUploader: React.FC<Props> = ({ value, onChange, valueMobile, onChangeMobile }) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Promo Videos</Label>
      <SingleUploader
        label="🖥️ Desktop (οριζόντιο)"
        placeholder="YouTube URL ή ανέβασε αρχείο"
        value={value}
        onChange={onChange}
      />
      <SingleUploader
        label="📱 Mobile (κάθετο)"
        placeholder="YouTube URL ή ανέβασε αρχείο"
        value={valueMobile}
        onChange={onChangeMobile}
      />
      <p className="text-xs text-muted-foreground">
        Το desktop βίντεο εμφανίζεται σε υπολογιστές/tablets, το mobile σε κινητά. YouTube ή απευθείας αρχείο (resumable upload, χωρίς όριο μεγέθους).
      </p>
    </div>
  );
};
