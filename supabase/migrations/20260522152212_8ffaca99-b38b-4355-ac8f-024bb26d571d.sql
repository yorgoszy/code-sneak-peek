
-- ============================================================
-- Module 13: Push Notification System
-- ============================================================

-- 1) push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('web','ios','android')),
  endpoint text,
  p256dh_key text,
  auth_key text,
  device_token text,
  device_info jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_unique_idx
  ON public.push_subscriptions (user_id, platform, COALESCE(endpoint, ''), COALESCE(device_token, ''));

CREATE INDEX IF NOT EXISTS push_subscriptions_active_idx
  ON public.push_subscriptions (user_id, is_active) WHERE is_active = true;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subs" ON public.push_subscriptions
  FOR SELECT USING (user_id = public.get_app_user_id_for_programs(auth.uid()) OR public.is_admin_user());

CREATE POLICY "Users insert own subs" ON public.push_subscriptions
  FOR INSERT WITH CHECK (user_id = public.get_app_user_id_for_programs(auth.uid()) OR public.is_admin_user());

CREATE POLICY "Users update own subs" ON public.push_subscriptions
  FOR UPDATE USING (user_id = public.get_app_user_id_for_programs(auth.uid()) OR public.is_admin_user());

CREATE POLICY "Users delete own subs" ON public.push_subscriptions
  FOR DELETE USING (user_id = public.get_app_user_id_for_programs(auth.uid()) OR public.is_admin_user());

CREATE TRIGGER trg_push_subs_updated
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE CASCADE,
  workout_reminder boolean DEFAULT true,
  program_assigned boolean DEFAULT true,
  test_scheduled boolean DEFAULT true,
  coach_message boolean DEFAULT true,
  rpe_reminder boolean DEFAULT true,
  health_card_expiry boolean DEFAULT true,
  booking_confirmation boolean DEFAULT true,
  booking_reminder_24h boolean DEFAULT true,
  goal_milestone boolean DEFAULT true,
  award_unlocked boolean DEFAULT true,
  muaythai_sparring_reminder boolean DEFAULT true,
  recovery_alert boolean DEFAULT true,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '08:00',
  timezone text DEFAULT 'Europe/Athens',
  email_channel boolean DEFAULT true,
  push_channel boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own prefs" ON public.notification_preferences
  FOR SELECT USING (user_id = public.get_app_user_id_for_programs(auth.uid()) OR public.is_admin_user());

CREATE POLICY "Users insert own prefs" ON public.notification_preferences
  FOR INSERT WITH CHECK (user_id = public.get_app_user_id_for_programs(auth.uid()) OR public.is_admin_user());

CREATE POLICY "Users update own prefs" ON public.notification_preferences
  FOR UPDATE USING (user_id = public.get_app_user_id_for_programs(auth.uid()) OR public.is_admin_user());

CREATE TRIGGER trg_notif_prefs_updated
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) notification_log
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('push','email','sms','in_app')),
  title text,
  body text,
  deep_link text,
  payload jsonb,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered boolean DEFAULT false,
  opened_at timestamptz,
  error_message text,
  subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS notification_log_user_idx ON public.notification_log (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS notification_log_type_idx ON public.notification_log (notification_type, sent_at DESC);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own log" ON public.notification_log
  FOR SELECT USING (
    user_id = public.get_app_user_id_for_programs(auth.uid())
    OR public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.app_users a
      WHERE a.id = notification_log.user_id
        AND a.coach_id = public.get_app_user_id_for_programs(auth.uid())
    )
  );

CREATE POLICY "Service insert log" ON public.notification_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update own log" ON public.notification_log
  FOR UPDATE USING (user_id = public.get_app_user_id_for_programs(auth.uid()) OR public.is_admin_user());

-- 4) notification_templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  locale text NOT NULL CHECK (locale IN ('el','en')),
  title_template text NOT NULL,
  body_template text NOT NULL,
  icon_url text,
  deep_link_template text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(notification_type, locale)
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All read templates" ON public.notification_templates
  FOR SELECT USING (true);

CREATE POLICY "Admins manage templates" ON public.notification_templates
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Auto-create preferences row for new app_users
CREATE OR REPLACE FUNCTION public.create_default_notification_prefs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_default_notif_prefs ON public.app_users;
CREATE TRIGGER trg_create_default_notif_prefs
  AFTER INSERT ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_prefs();

-- 7) Feature flag (uses existing feature_flags table if present, otherwise skip silently)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='feature_flags') THEN
    INSERT INTO public.feature_flags (flag_key, enabled)
    VALUES ('push_notifications_enabled', false)
    ON CONFLICT (flag_key) DO NOTHING;
  END IF;
END $$;

-- 6) Seed notification_templates
INSERT INTO public.notification_templates (notification_type, locale, title_template, body_template, deep_link_template) VALUES
('workout_reminder','el','Έχεις προπόνηση σύντομα','Η προπόνηση {{program_name}} ξεκινά σε {{minutes}} λεπτά','/dashboard/active-programs'),
('workout_reminder','en','Workout starting soon','{{program_name}} starts in {{minutes}} minutes','/dashboard/active-programs'),
('program_assigned','el','Νέο πρόγραμμα ανατέθηκε','Ο/Η {{coach_name}} σου ανέθεσε το πρόγραμμα {{program_name}}','/dashboard/active-programs'),
('program_assigned','en','New program assigned','{{coach_name}} assigned you {{program_name}}','/dashboard/active-programs'),
('test_scheduled','el','Νέο test προγραμματίστηκε','{{test_type}} στις {{test_date}} στις {{test_time}}','/dashboard/tests'),
('test_scheduled','en','New test scheduled','{{test_type}} on {{test_date}} at {{test_time}}','/dashboard/tests'),
('coach_message','el','Μήνυμα από τον προπονητή σου','{{message_preview}}','/dashboard/coach-profile'),
('coach_message','en','Message from your coach','{{message_preview}}','/dashboard/coach-profile'),
('rpe_reminder','el','Δώσε RPE για τη σημερινή προπόνηση','Πόσο δύσκολη ήταν; (1-10)','/dashboard/user-profile'),
('rpe_reminder','en','Rate your workout','How hard was it? (1-10)','/dashboard/user-profile'),
('health_card_expiry','el','Η ιατρική σου βεβαίωση λήγει σύντομα','Λήγει σε {{days}} ημέρες. Ανανέωσέ τη.','/dashboard/health-cards'),
('health_card_expiry','en','Your health card expires soon','Expires in {{days}} days. Renew it.','/dashboard/health-cards'),
('booking_confirmation','el','Επιβεβαίωση κράτησης','Κράτησες θέση για {{session_name}} στις {{session_date}} {{session_time}}','/dashboard/online-booking'),
('booking_confirmation','en','Booking confirmed','Booked {{session_name}} on {{session_date}} {{session_time}}','/dashboard/online-booking'),
('booking_reminder_24h','el','Υπενθύμιση κράτησης','{{session_name}} αύριο στις {{session_time}}','/dashboard/online-booking'),
('booking_reminder_24h','en','Booking reminder','{{session_name}} tomorrow at {{session_time}}','/dashboard/online-booking'),
('goal_milestone','el','Πέτυχες ορόσημο!','Έφτασες {{milestone_pct}}% του στόχου: {{goal_name}}','/dashboard/goals'),
('goal_milestone','en','Milestone reached!','You reached {{milestone_pct}}% of: {{goal_name}}','/dashboard/goals'),
('award_unlocked','el','Ξεκλείδωσες νέο βραβείο!','{{award_name}}','/dashboard/awards'),
('award_unlocked','en','New award unlocked!','{{award_name}}','/dashboard/awards'),
('muaythai_sparring_reminder','el','Sparring session σήμερα','Στις {{time}} με {{partner_count}} σπρίντερ. Καλή τύχη!','/dashboard/combat-training-tracker'),
('muaythai_sparring_reminder','en','Sparring session today','At {{time}} with {{partner_count}} partners. Good luck!','/dashboard/combat-training-tracker'),
('recovery_alert','el','Υψηλή κούραση - πρόσεξε ανάκαμψη','Το ACWR σου είναι {{acwr}}. Σκέψου εξτρά recovery αυτή την εβδομάδα.','/dashboard/load-monitoring'),
('recovery_alert','en','High load - watch your recovery','Your ACWR is {{acwr}}. Consider extra recovery this week.','/dashboard/load-monitoring')
ON CONFLICT (notification_type, locale) DO NOTHING;
