-- Add 3D position columns to muscles table for body mapping
ALTER TABLE public.muscles 
ADD COLUMN IF NOT EXISTS position_x DECIMAL(10, 4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS position_y DECIMAL(10, 4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS position_z DECIMAL(10, 4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS texture_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.muscles.position_x IS 'X coordinate on 3D body model';
COMMENT ON COLUMN public.muscles.position_y IS 'Y coordinate on 3D body model';
COMMENT ON COLUMN public.muscles.position_z IS 'Z coordinate on 3D body model';
COMMENT ON COLUMN public.muscles.texture_url IS 'URL to muscle texture/image for 3D overlay';