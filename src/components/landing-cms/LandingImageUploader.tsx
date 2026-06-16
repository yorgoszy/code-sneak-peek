import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  pathPrefix?: string;
}

/** Upload image to the public `uploads` bucket under landing/ prefix. */
export const LandingImageUploader: React.FC<Props> = ({
  value,
  onChange,
  label = 'Εικόνα',
  pathPrefix = 'landing',
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('uploads').upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('uploads').getPublicUrl(filename);
      onChange(data.publicUrl);
      toast.success('Η εικόνα ανέβηκε');
    } catch (e: any) {
      toast.error('Σφάλμα ανεβάσματος: ' + (e?.message ?? String(e)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {value ? (
        <div className="relative inline-block border border-border">
          <img src={value} alt="" className="max-h-40 object-contain" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 bg-black/70 text-white p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="URL εικόνας ή ανέβασε αρχείο"
          className="rounded-none"
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-1" />
          {uploading ? '...' : 'Upload'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
};
