-- Create table for storing landing page layouts
CREATE TABLE public.landing_page_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Untitled Page',
  layout_data JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.app_users(id),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.landing_page_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can view all layouts" 
ON public.landing_page_layouts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid()::text::uuid 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can create layouts" 
ON public.landing_page_layouts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid()::text::uuid 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update layouts" 
ON public.landing_page_layouts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid()::text::uuid 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete layouts" 
ON public.landing_page_layouts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid()::text::uuid 
    AND role = 'admin'
  )
);

-- Public can view active published layout
CREATE POLICY "Public can view active layout" 
ON public.landing_page_layouts 
FOR SELECT 
USING (is_published = true AND is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_landing_page_layouts_updated_at
BEFORE UPDATE ON public.landing_page_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();