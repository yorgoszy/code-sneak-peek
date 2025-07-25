-- Προσθήκη πεδίου για booking sections στους τύπους συνδρομών
ALTER TABLE public.subscription_types 
ADD COLUMN allowed_sections UUID[] DEFAULT NULL;

-- Δημιουργία ευρετηρίου για καλύτερη απόδοση
CREATE INDEX idx_subscription_types_allowed_sections 
ON public.subscription_types USING GIN (allowed_sections);

-- Σχόλια για τεκμηρίωση
COMMENT ON COLUMN public.subscription_types.allowed_sections IS 'Array of booking section IDs that this subscription type allows access to. NULL means all sections allowed.';