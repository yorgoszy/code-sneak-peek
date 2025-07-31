-- Δημιουργία πίνακα για acknowledged notifications
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'purchase', 'offer', 'user', 'booking'
  item_id UUID NOT NULL, -- το ID του purchase, offer, user, booking
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_user_id, notification_type, item_id)
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Μόνο admins μπορούν να χειρίζονται τα notifications
CREATE POLICY "Admins can manage notifications" 
ON public.admin_notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
);