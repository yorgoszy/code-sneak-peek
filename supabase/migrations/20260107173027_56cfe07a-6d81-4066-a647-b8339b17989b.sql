-- Αναθέτουμε τα orphan templates (created_by = NULL) στον admin
UPDATE block_templates 
SET created_by = 'c6d44641-3b95-46bd-8270-e5ed72de25ad'
WHERE created_by IS NULL;