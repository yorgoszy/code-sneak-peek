-- Διόρθωση του κειμένου για το πακέτο 10 επισκέψεων
UPDATE subscription_types 
SET description = 'Πακέτο 10 επισκέψεων με διάρκεια 6 μηνών'
WHERE name = '10 Επισκέψεις' AND description = 'Πακέτο 10 επισκέψεων με διάρκεια 3 μηνών';