-- Add missing name column to campaign_prizes table
ALTER TABLE public.campaign_prizes 
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Βραβείο';

-- Update existing records with appropriate names
UPDATE public.campaign_prizes 
SET name = CASE 
  WHEN prize_type = 'subscription' THEN 'Δωρεάν Συνδρομή'
  WHEN prize_type = 'visit_package' THEN 'Πακέτο Επισκέψεων'
  WHEN prize_type = 'videocall_package' THEN 'Πακέτο Βιντεοκλήσεων'
  WHEN prize_type = 'discount_coupon' THEN 'Κουπόνι Έκπτωσης'
  WHEN prize_type = 'try_again' THEN 'Δοκίμασε Ξανά'
  WHEN prize_type = 'nothing' THEN 'Δεν Κέρδισες'
  ELSE 'Βραβείο'
END
WHERE name = 'Βραβείο';

-- Add is_active column to campaign_prizes table  
ALTER TABLE public.campaign_prizes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;