import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    // Get the provider token (Google access token)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    const body = await req.json();
    const { action, provider_token, event } = body;

    if (!provider_token) {
      return new Response(JSON.stringify({ 
        error: 'Δεν βρέθηκε Google token. Πρέπει να συνδεθείτε με Google.',
        code: 'NO_GOOGLE_TOKEN'
      }), { status: 400, headers: corsHeaders });
    }

    switch (action) {
      case 'create_event': {
        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: event.summary,
              description: event.description || '',
              start: {
                dateTime: event.start_datetime,
                timeZone: event.timezone || 'Europe/Athens',
              },
              end: {
                dateTime: event.end_datetime,
                timeZone: event.timezone || 'Europe/Athens',
              },
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 30 },
                ],
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Google Calendar API error:', errorData);
          return new Response(JSON.stringify({ 
            error: 'Αποτυχία δημιουργίας event', 
            details: errorData 
          }), { status: response.status, headers: corsHeaders });
        }

        const calendarEvent = await response.json();
        return new Response(JSON.stringify({ 
          success: true, 
          event_id: calendarEvent.id,
          html_link: calendarEvent.htmlLink 
        }), { headers: corsHeaders });
      }

      case 'delete_event': {
        const { event_id } = body;
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${provider_token}`,
            },
          }
        );

        if (!response.ok && response.status !== 404) {
          return new Response(JSON.stringify({ error: 'Αποτυχία διαγραφής event' }), { 
            status: response.status, headers: corsHeaders 
          });
        }

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case 'create_multiple': {
        const { events } = body;
        const results = [];

        for (const evt of events) {
          const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${provider_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                summary: evt.summary,
                description: evt.description || '',
                start: {
                  dateTime: evt.start_datetime,
                  timeZone: evt.timezone || 'Europe/Athens',
                },
                end: {
                  dateTime: evt.end_datetime,
                  timeZone: evt.timezone || 'Europe/Athens',
                },
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: 'popup', minutes: 30 },
                  ],
                },
              }),
            }
          );

          if (response.ok) {
            const calendarEvent = await response.json();
            results.push({ success: true, event_id: calendarEvent.id, summary: evt.summary });
          } else {
            const errorData = await response.json();
            results.push({ success: false, summary: evt.summary, error: errorData });
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          results,
          created: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }), { headers: corsHeaders });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
