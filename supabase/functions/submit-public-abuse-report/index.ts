import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ABUSE_TYPE_LABELS: Record<string, string> = {
  physical: 'Σωματική',
  psychological: 'Ψυχολογική',
  sexual: 'Σεξουαλική',
  verbal: 'Λεκτική',
  bullying: 'Εκφοβισμός',
  other: 'Άλλο',
};

function esc(s: string) {
  return String(s || '').replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
  }[c] as string));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json();
    const {
      reporter_name,
      reporter_email,
      reporter_phone,
      sport,
      club_id,
      club_name_text,
      club_address,
      club_city,
      club_country,
      coach_id,
      coach_name_text,
      abuse_types,
      description,
      incident_date,
      is_anonymous,
    } = body || {};

    // Validation
    if (!reporter_name?.trim() || !reporter_email?.trim()) {
      return new Response(JSON.stringify({ error: 'Όνομα και email είναι υποχρεωτικά' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!Array.isArray(abuse_types) || abuse_types.length === 0) {
      return new Response(JSON.stringify({ error: 'Επιλέξτε τουλάχιστον έναν τύπο' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!sport?.trim()) {
      return new Response(JSON.stringify({ error: 'Το άθλημα είναι υποχρεωτικό' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert report
    const { data: inserted, error: insErr } = await supabase
      .from('abuse_reports')
      .insert({
        athlete_id: null,
        is_public_submission: true,
        reporter_name: reporter_name.trim(),
        reporter_email: reporter_email.trim().toLowerCase(),
        reporter_phone: reporter_phone?.trim() || null,
        sport: sport.trim(),
        club_id: club_id || null,
        club_name_text: club_name_text?.trim() || null,
        club_address: club_address?.trim() || null,
        club_city: club_city?.trim() || null,
        club_country: club_country?.trim() || null,
        coach_id: coach_id || null,
        coach_name_text: coach_name_text?.trim() || null,
        abuse_types,
        description: description?.trim() || '—',
        incident_date: incident_date || null,
        is_anonymous: !!is_anonymous,
      })
      .select()
      .single();

    if (insErr) throw insErr;

    // Lookup club / coach names for email
    let clubName = club_name_text || 'Δεν αναφέρθηκε';
    let clubEmail = '';
    if (club_id) {
      const { data: club } = await supabase.from('app_users').select('name, email').eq('id', club_id).maybeSingle();
      if (club) { clubName = club.name; clubEmail = club.email || ''; }
    }
    let coachName = coach_name_text || 'Δεν αναφέρθηκε';
    if (coach_id && !coach_name_text) {
      const { data: coach } = await supabase.from('app_users').select('name').eq('id', coach_id).maybeSingle();
      if (coach) coachName = coach.name;
    }

    // Find federations by sport
    let federations: any[] = [];
    const { data: bySport } = await supabase
      .from('app_users')
      .select('id, name, email, sport')
      .eq('role', 'federation')
      .ilike('sport', sport.trim());
    federations = (bySport || []).filter((f: any) => f.email);

    // Always notify admin
    const adminEmail = 'yorgoszy@gmail.com';

    const typesText = abuse_types.map((t: string) => ABUSE_TYPE_LABELS[t] || t).join(', ');
    const reporterDisplay = is_anonymous
      ? 'Ανώνυμη καταγγελία (στοιχεία απόκρυφα κατόπιν αιτήματος)'
      : `${esc(reporter_name)} · ${esc(reporter_email)}${reporter_phone ? ' · ' + esc(reporter_phone) : ''}`;
    const incidentDateText = incident_date
      ? new Date(incident_date).toLocaleDateString('el-GR')
      : 'Δεν αναφέρθηκε';
    const clubAddressText = [club_address, club_city, club_country].filter(Boolean).map(esc).join(', ') || '—';

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#fff;color:#000;padding:20px;max-width:640px;margin:auto;">
      <div style="border-left:4px solid #d32f2f;padding-left:16px;margin-bottom:24px;">
        <h2 style="color:#d32f2f;margin:0 0 8px;">⚠️ Δημόσια Καταγγελία Κακοποίησης</h2>
        <p style="margin:0;color:#666;font-size:13px;">Υποβλήθηκε από το /report-abuse</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:40%;">Καταγγέλλων:</td><td style="padding:8px;border-bottom:1px solid #eee;">${reporterDisplay}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Άθλημα:</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(sport)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Σύλλογος:</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(clubName)}${clubEmail ? ' (' + esc(clubEmail) + ')' : ''}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Διεύθυνση συλλόγου:</td><td style="padding:8px;border-bottom:1px solid #eee;">${clubAddressText}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Προπονητής:</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(coachName)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Τύπος:</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(typesText)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Ημερομηνία περιστατικού:</td><td style="padding:8px;border-bottom:1px solid #eee;">${incidentDateText}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Υποβολή:</td><td style="padding:8px;border-bottom:1px solid #eee;">${new Date(inserted.created_at).toLocaleString('el-GR')}</td></tr>
      </table>
      <div style="background:#f5f5f5;padding:16px;margin-bottom:20px;">
        <h3 style="margin:0 0 8px;font-size:14px;">Περιγραφή:</h3>
        <p style="margin:0;white-space:pre-wrap;line-height:1.5;">${esc(description || '—')}</p>
      </div>
      <p style="font-size:12px;color:#999;">ID: ${inserted.id}</p>
    </body></html>`;

    const subject = `⚠️ Δημόσια Καταγγελία - ${clubName} (${sport})`;
    const recipients = [...new Set([adminEmail, ...federations.map((f) => f.email)])].filter(Boolean);

    let emailsSent = 0;
    for (const email of recipients) {
      try {
        const { error: emailErr } = await supabase.functions.invoke('send-transactional-email', {
          body: {
            recipientEmail: email,
            subject,
            htmlContent: html,
            idempotencyKey: `public-abuse-${inserted.id}-${email}`,
          },
        });
        if (!emailErr) emailsSent++;
        await new Promise((r) => setTimeout(r, 550));
      } catch (e) {
        console.error('Email failed', email, e);
      }
    }

    // Update notified federation ids
    if (federations.length > 0) {
      await supabase
        .from('abuse_reports')
        .update({ notified_federation_ids: federations.map((f: any) => f.id) })
        .eq('id', inserted.id);
    }

    return new Response(JSON.stringify({ success: true, reportId: inserted.id, emailsSent }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('submit-public-abuse-report error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
