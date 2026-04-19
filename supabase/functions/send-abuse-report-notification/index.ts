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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reportId } = await req.json();
    if (!reportId) {
      return new Response(JSON.stringify({ error: 'Missing reportId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Φόρτωση καταγγελίας
    const { data: report, error: reportErr } = await supabase
      .from('abuse_reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (reportErr || !report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership (αθλητής)
    const { data: athlete } = await supabase
      .from('app_users')
      .select('id, name, email, auth_user_id')
      .eq('id', report.athlete_id)
      .maybeSingle();

    if (!athlete || athlete.auth_user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Coach / Club info
    let coachName = report.coach_name_text || 'Δεν αναφέρθηκε';
    let clubName = 'Άγνωστος';
    let clubEmail = '';
    const clubLookupId = report.club_id || report.coach_id;
    if (clubLookupId) {
      const { data: club } = await supabase
        .from('app_users')
        .select('name, email')
        .eq('id', clubLookupId)
        .maybeSingle();
      if (club) {
        clubName = club.name;
        clubEmail = club.email;
      }
    }

    // Find federations: prefer those that declare the same sport, else by club link
    let federations: any[] = [];
    if (report.sport) {
      const { data: bySport } = await supabase
        .from('app_users')
        .select('id, name, email, sport')
        .eq('role', 'federation')
        .ilike('sport', report.sport);
      federations = (bySport || []).filter((f: any) => f.email);
    }

    if (federations.length === 0) {
      // Fallback: federations linked to the club
      const { data: federationLinks } = await supabase
        .from('federation_clubs')
        .select('federation_id, federation:app_users!federation_clubs_federation_id_fkey(id, name, email)')
        .eq('club_id', clubLookupId);
      federations = (federationLinks || [])
        .map((l: any) => l.federation)
        .filter(Boolean);
    }

    if (federations.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        warning: 'Καμία ομοσπονδία δεν συνδέεται με αυτόν τον προπονητή',
        notified: 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const typesText = (report.abuse_types || [])
      .map((t: string) => ABUSE_TYPE_LABELS[t] || t)
      .join(', ');

    const reporterDisplay = report.is_anonymous
      ? 'Ανώνυμος αθλητής (στοιχεία απόκρυφα κατόπιν αιτήματος)'
      : `${athlete.name} (${athlete.email})`;

    const incidentDateText = report.incident_date
      ? new Date(report.incident_date).toLocaleDateString('el-GR')
      : 'Δεν αναφέρθηκε';

    const html = `
      <!DOCTYPE html>
      <html><body style="font-family:Arial,sans-serif;background:#fff;color:#000;padding:20px;max-width:600px;margin:auto;">
        <div style="border-left:4px solid #d32f2f;padding-left:16px;margin-bottom:24px;">
          <h2 style="color:#d32f2f;margin:0 0 8px;">⚠️ Καταγγελία Κακοποίησης</h2>
          <p style="margin:0;color:#666;font-size:13px;">Επείγουσα ειδοποίηση προς ομοσπονδία</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:40%;">Καταγγέλλων:</td><td style="padding:8px;border-bottom:1px solid #eee;">${reporterDisplay}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Καταγγελλόμενος προπονητής:</td><td style="padding:8px;border-bottom:1px solid #eee;">${coachName}${coachEmail ? ` (${coachEmail})` : ''}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Τύπος κακοποίησης:</td><td style="padding:8px;border-bottom:1px solid #eee;">${typesText}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Ημερομηνία περιστατικού:</td><td style="padding:8px;border-bottom:1px solid #eee;">${incidentDateText}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Ημερομηνία υποβολής:</td><td style="padding:8px;border-bottom:1px solid #eee;">${new Date(report.created_at).toLocaleString('el-GR')}</td></tr>
        </table>

        <div style="background:#f5f5f5;padding:16px;border-radius:0;margin-bottom:20px;">
          <h3 style="margin:0 0 8px;font-size:14px;">Περιγραφή περιστατικού:</h3>
          <p style="margin:0;white-space:pre-wrap;line-height:1.5;">${report.description.replace(/</g, '&lt;')}</p>
        </div>

        <div style="background:#fff3cd;padding:12px;border-left:4px solid #ffc107;font-size:13px;color:#664d03;">
          Παρακαλούμε όπως διερευνήσετε άμεσα το περιστατικό σύμφωνα με τις διαδικασίες της ομοσπονδίας σας. Η αναφορά είναι εμπιστευτική.
        </div>

        <p style="font-size:12px;color:#999;margin-top:24px;">
          ID Αναφοράς: ${report.id}
        </p>
      </body></html>
    `;

    const subject = `⚠️ Καταγγελία Κακοποίησης - Προπονητής: ${coachName}`;

    // Στείλε email σε κάθε ομοσπονδία (αν υπάρχει send-transactional-email function)
    let emailsSent = 0;
    for (const fed of federations) {
      if (!fed.email) continue;
      try {
        const { error: emailErr } = await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'abuse-report-notification',
            recipientEmail: fed.email,
            idempotencyKey: `abuse-report-${reportId}-${fed.id}`,
            templateData: {
              federationName: fed.name,
              reporterDisplay,
              coachName,
              coachEmail,
              typesText,
              incidentDateText,
              description: report.description,
              reportId: report.id,
              submittedAt: new Date(report.created_at).toLocaleString('el-GR'),
            },
          },
        });
        if (!emailErr) emailsSent++;
      } catch (e) {
        console.error(`Email send failed for ${fed.email}:`, e);
      }
    }

    // Update notified_federation_ids
    const fedIds = federations.map((f: any) => f.id);
    await supabase
      .from('abuse_reports')
      .update({ notified_federation_ids: fedIds })
      .eq('id', reportId);

    return new Response(JSON.stringify({
      success: true,
      notified: federations.length,
      emailsSent,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error in send-abuse-report-notification:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
