-- Προσθήκη πεδίου is_athlete στους χρήστες
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS is_athlete BOOLEAN DEFAULT false;

-- Προσθήκη πεδίου is_competition_day στις ημέρες προγραμμάτων
ALTER TABLE program_days
ADD COLUMN IF NOT EXISTS is_competition_day BOOLEAN DEFAULT false;

-- Σχόλια για τα νέα πεδία
COMMENT ON COLUMN app_users.is_athlete IS 'Δηλώνει αν ο χρήστης είναι αθλητής - χρησιμοποιείται για να εμφανίζονται ημέρες αγώνων';
COMMENT ON COLUMN program_days.is_competition_day IS 'Δηλώνει αν η ημέρα είναι ημέρα αγώνα - εμφανίζεται μόνο σε αθλητές';