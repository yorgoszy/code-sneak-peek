-- Update the two expenses with incorrect expense_number format
UPDATE expenses 
SET expense_number = 'ΕΞ-0008' 
WHERE id = '9543b7d2-5a3f-49c5-9cf6-ac0c24d9a8bd';

UPDATE expenses 
SET expense_number = 'ΕΞ-0009' 
WHERE id = '0ec75904-0d7a-4d3c-b520-bb9b5cc19c8c';