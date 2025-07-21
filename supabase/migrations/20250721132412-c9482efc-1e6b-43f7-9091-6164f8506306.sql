-- Προσθήκη πεδίου is_paid στις συνδρομές για παρακολούθηση πληρωμών
ALTER TABLE public.user_subscriptions 
ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT true;

-- Προσθήκη σχολίου για το νέο πεδίο
COMMENT ON COLUMN public.user_subscriptions.is_paid IS 'Δείχνει αν η συνδρομή είναι πληρωμένη (true) ή μη πληρωμένη (false)';