import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOTIFY_EMAIL = 'yorgoszy@gmail.com';

interface LeadPayload {
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  interest?: string;
  sessionId?: string;
  language?: string;
  userAgent?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as LeadPayload;

    // Validation
    const name = (body.name || '').trim().slice(0, 100);
    const phone = (body.phone || '').trim().slice(0, 30);
    const email = (body.email || '').trim().slice(0, 255);
    const message = (body.message || '').trim().slice(0, 1000);
    const interest = (body.interest || '').trim().slice(0, 200);

    if (!name || name.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!phone && !email) {
      return new Response(
        JSON.stringify({ error: 'Phone or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Insert lead
    const { data: lead, error: insertError } = await supabase
      .from('landing_leads')
      .insert({
        name,
        phone: phone || null,
        email: email || null,
        message: message || null,
        interest: interest || null,
        session_id: body.sessionId || null,
        language: body.language || 'el',
        user_agent: body.userAgent || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email notification via existing send-videocall-notifications function pattern
    // Use direct net call to admin email
    try {
      const subject = `🔔 Νέο Lead από Hyper AI: ${name}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000; color: #00ffba; padding: 20px;">
            <h1 style="margin: 0; font-size: 20px;">Νέο Lead από Hyper AI Chatbot</h1>
          </div>
          <div style="padding: 20px; background: #fff; border: 1px solid #eee;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;"><strong>Όνομα:</strong></td><td>${escapeHtml(name)}</td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Τηλέφωνο:</strong></td><td><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>` : ''}
              ${email ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>` : ''}
              ${interest ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Ενδιαφέρον:</strong></td><td>${escapeHtml(interest)}</td></tr>` : ''}
              ${message ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;"><strong>Μήνυμα:</strong></td><td>${escapeHtml(message)}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #666;"><strong>Ώρα:</strong></td><td>${new Date().toLocaleString('el-GR', { timeZone: 'Europe/Athens' })}</td></tr>
            </table>
          </div>
          <div style="padding: 15px; background: #f5f5f5; font-size: 12px; color: #999; text-align: center;">
            Αυτόματη ειδοποίηση από hyperkids.gr
          </div>
        </div>
      `;

      const text = `Νέο Lead από Hyper AI\n\nΌνομα: ${name}\n${phone ? `Τηλέφωνο: ${phone}\n` : ''}${email ? `Email: ${email}\n` : ''}${interest ? `Ενδιαφέρον: ${interest}\n` : ''}${message ? `Μήνυμα: ${message}\n` : ''}`;

      // Try Resend first if available
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Hyperkids <onboarding@resend.dev>',
            to: [NOTIFY_EMAIL],
            reply_to: email || undefined,
            subject,
            html,
            text,
          }),
        });
        if (!resendResp.ok) {
          console.error('Resend error:', await resendResp.text());
        }
      } else {
        console.warn('RESEND_API_KEY not configured — skipping email notification');
      }

      // Mark as notified
      await supabase
        .from('landing_leads')
        .update({ notified: true })
        .eq('id', lead.id);
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr);
      // Don't fail the request if email fails — lead is saved
    }

    return new Response(
      JSON.stringify({ success: true, id: lead.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('submit-landing-lead error:', err);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
