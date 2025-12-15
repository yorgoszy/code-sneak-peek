-- Add mesh_name column to muscles table for 3D mesh mapping
ALTER TABLE public.muscles 
ADD COLUMN mesh_name TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.muscles.mesh_name IS 'Name of the 3D mesh from the OBJ model (includes _Left or _Right suffix)';