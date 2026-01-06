-- Διαγραφή της επικίνδυνης πολιτικής που επιτρέπει σε όλους να βλέπουν όλες τις αποδείξεις
DROP POLICY IF EXISTS "Users can view all receipts" ON public.receipts;