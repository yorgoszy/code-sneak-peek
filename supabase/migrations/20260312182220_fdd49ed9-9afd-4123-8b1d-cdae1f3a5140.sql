ALTER TABLE public.competition_rings 
ADD COLUMN source_type text NOT NULL DEFAULT 'youtube',
ADD COLUMN camera_device_id text NULL;