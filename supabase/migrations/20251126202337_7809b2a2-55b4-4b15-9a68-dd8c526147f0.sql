-- Add UPDATE and DELETE policies for admins on ai_global_knowledge table

-- Update policy
CREATE POLICY "Only admins can update global knowledge"
ON ai_global_knowledge
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- Delete policy
CREATE POLICY "Only admins can delete global knowledge"
ON ai_global_knowledge
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);