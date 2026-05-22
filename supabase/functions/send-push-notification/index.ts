// Module 13: Web Push notification sender
// Native iOS/Android (FCM/APNs) is wired but inactive until FCM_SERVER_KEY/APNS keys are configured.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@hyperkids.gr";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  } catch (e) {
    console.error("VAPID setup error", e);
  }
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function render(tpl: string, vars: Record<string, unknown>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars?.[k] ?? ""));
}

function inQuietHours(start: string, end: string, tz: string): boolean {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz,
    });
    const [h, m] = fmt.format(now).split(":").map(Number);
    const cur = h * 60 + m;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    return s <= e ? cur >= s && cur < e : cur >= s || cur < e;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, notification_type, variables = {}, force_send = false } = await req.json();
    if (!user_id || !notification_type) {
      return new Response(JSON.stringify({ error: "user_id and notification_type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!force_send && prefs) {
      if (prefs.push_channel === false) {
        return new Response(JSON.stringify({ skipped: "push_channel disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (prefs[notification_type] === false) {
        return new Response(JSON.stringify({ skipped: `${notification_type} disabled` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (inQuietHours(prefs.quiet_hours_start ?? "22:00", prefs.quiet_hours_end ?? "08:00", prefs.timezone ?? "Europe/Athens")) {
        return new Response(JSON.stringify({ skipped: "quiet hours" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Determine user locale (default 'el')
    const { data: user } = await supabase
      .from("app_users").select("language").eq("id", user_id).maybeSingle();
    const locale = (user?.language === "en") ? "en" : "el";

    const { data: tpl } = await supabase
      .from("notification_templates")
      .select("*")
      .eq("notification_type", notification_type)
      .eq("locale", locale)
      .maybeSingle();

    if (!tpl) {
      return new Response(JSON.stringify({ error: "template not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = render(tpl.title_template, variables);
    const body = render(tpl.body_template, variables);
    const deepLink = tpl.deep_link_template ? render(tpl.deep_link_template, variables) : "/";

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true);

    let sent = 0, failed = 0;
    const errors: string[] = [];

    for (const sub of subs ?? []) {
      try {
        if (sub.platform === "web") {
          if (!VAPID_PUBLIC || !VAPID_PRIVATE) throw new Error("VAPID keys not configured");
          if (!sub.endpoint || !sub.p256dh_key || !sub.auth_key) throw new Error("incomplete web sub");
          const payload = JSON.stringify({
            title, body, deep_link: deepLink,
            icon: tpl.icon_url ?? "/icon-192.png",
            badge: "/icon-192.png",
          });
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
            payload,
            { TTL: 86400 },
          );
          sent++;
          await supabase.from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() }).eq("id", sub.id);
          await supabase.from("notification_log").insert({
            user_id, notification_type, channel: "push", title, body, deep_link: deepLink,
            payload: variables, delivered: true, subscription_id: sub.id,
          });
        } else {
          // TODO: native FCM/APNs send — activate when FCM_SERVER_KEY / APNS_KEY secrets are added
          await supabase.from("notification_log").insert({
            user_id, notification_type, channel: "push", title, body, deep_link: deepLink,
            payload: variables, delivered: false, subscription_id: sub.id,
            error_message: "Native push not yet activated",
          });
        }
      } catch (e: any) {
        failed++;
        const msg = e?.message ?? String(e);
        errors.push(msg);
        // Deactivate dead subscriptions
        if (e?.statusCode === 410 || e?.statusCode === 404) {
          await supabase.from("push_subscriptions")
            .update({ is_active: false }).eq("id", sub.id);
        }
        await supabase.from("notification_log").insert({
          user_id, notification_type, channel: "push", title, body, deep_link: deepLink,
          payload: variables, delivered: false, subscription_id: sub.id, error_message: msg,
        });
      }
    }

    return new Response(JSON.stringify({ sent, failed, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-push-notification error", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
