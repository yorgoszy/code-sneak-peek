
-- Module 14: Unified AI Agent (prefixed agent_ to avoid clash with existing ai_conversations)

CREATE TABLE public.agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('admin','coach','athlete','general')),
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,
  archived boolean DEFAULT false
);
CREATE INDEX idx_agent_conv_user_recent ON public.agent_conversations (user_id, last_message_at DESC) WHERE archived = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_conversations TO authenticated;
GRANT ALL ON public.agent_conversations TO service_role;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_conv_select" ON public.agent_conversations FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()) OR public.is_admin_user());
CREATE POLICY "agent_conv_insert" ON public.agent_conversations FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()) OR public.is_admin_user());
CREATE POLICY "agent_conv_update" ON public.agent_conversations FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()) OR public.is_admin_user());
CREATE POLICY "agent_conv_delete" ON public.agent_conversations FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()) OR public.is_admin_user());


CREATE TABLE public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content text,
  tool_calls jsonb,
  tool_call_id text,
  tokens_used integer,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_msg_conv ON public.agent_messages (conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_messages TO authenticated;
GRANT ALL ON public.agent_messages TO service_role;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_msg_select" ON public.agent_messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT id FROM public.agent_conversations WHERE user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())) OR public.is_admin_user());
CREATE POLICY "agent_msg_insert" ON public.agent_messages FOR INSERT TO authenticated
  WITH CHECK (conversation_id IN (SELECT id FROM public.agent_conversations WHERE user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())) OR public.is_admin_user());
CREATE POLICY "agent_msg_delete" ON public.agent_messages FOR DELETE TO authenticated
  USING (conversation_id IN (SELECT id FROM public.agent_conversations WHERE user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())) OR public.is_admin_user());


CREATE TABLE public.agent_tool_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.agent_messages(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.app_users(id),
  tool_name text NOT NULL,
  arguments jsonb,
  result jsonb,
  error text,
  required_confirmation boolean DEFAULT false,
  confirmed boolean DEFAULT false,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES public.app_users(id),
  executed_at timestamptz,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_tool_exec_user ON public.agent_tool_executions (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.agent_tool_executions TO authenticated;
GRANT ALL ON public.agent_tool_executions TO service_role;
ALTER TABLE public.agent_tool_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_tool_exec_select" ON public.agent_tool_executions FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()) OR public.is_admin_user());


CREATE TABLE public.agent_pending_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  arguments jsonb NOT NULL,
  description text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  resolved boolean DEFAULT false,
  resolution text CHECK (resolution IN ('approved','rejected','expired') OR resolution IS NULL),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_pending_user ON public.agent_pending_confirmations (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.agent_pending_confirmations TO authenticated;
GRANT ALL ON public.agent_pending_confirmations TO service_role;
ALTER TABLE public.agent_pending_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_pending_select" ON public.agent_pending_confirmations FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()) OR public.is_admin_user());
CREATE POLICY "agent_pending_insert" ON public.agent_pending_confirmations FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()) OR public.is_admin_user());
CREATE POLICY "agent_pending_update" ON public.agent_pending_confirmations FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()) OR public.is_admin_user());


-- Feature flag
INSERT INTO public.feature_flags (flag_key, enabled, description)
VALUES ('ai_agent_unified', false, 'Module 14: Unified AI Agent with role-based modes (Gemini)')
ON CONFLICT (flag_key) DO NOTHING;
