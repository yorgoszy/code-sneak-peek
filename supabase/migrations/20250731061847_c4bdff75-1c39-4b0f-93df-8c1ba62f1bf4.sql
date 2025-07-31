-- Ενημέρωση των υπαρχόντων εγγραφών app_users που δεν έχουν auth_user_id
-- αλλά υπάρχει αντίστοιχος χρήστης στο auth.users
UPDATE public.app_users 
SET auth_user_id = au.id,
    updated_at = NOW()
FROM auth.users au
WHERE app_users.email = au.email 
  AND app_users.auth_user_id IS NULL;

-- Τώρα προσθέτουμε τους υπόλοιπους χρήστες που δεν έχουν καθόλου εγγραφή στο app_users
INSERT INTO public.app_users (auth_user_id, email, name, user_status, role)
SELECT 
  au.id as auth_user_id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  'active' as user_status,  -- Αν έχουν email confirmed, είναι ενεργοί
  'general' as role
FROM auth.users au
LEFT JOIN public.app_users app ON au.id = app.auth_user_id
WHERE app.id IS NULL
  AND au.email_confirmed_at IS NOT NULL;