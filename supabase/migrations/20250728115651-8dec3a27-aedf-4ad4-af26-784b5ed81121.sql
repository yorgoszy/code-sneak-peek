-- Add target_users column to magic_boxes table for selective notifications
ALTER TABLE magic_boxes 
ADD COLUMN target_users UUID[] DEFAULT NULL;