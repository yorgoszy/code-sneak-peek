import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { propertyId } = await req.json()
    
    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: 'Property ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Google Analytics API key from Supabase secrets
    const apiKey = Deno.env.get('GOOGLE_ANALYTICS_API_KEY')
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Analytics API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Google Analytics Reporting API v4 endpoint
    const analyticsUrl = `https://analyticsreporting.googleapis.com/v4/reports:batchGet?key=${apiKey}`;
    
    // Μετατρέπουμε το G-XXXXXXXXX σε view ID (αφαιρούμε το G- prefix)
    const viewId = propertyId.replace('G-', '');
    
    const requestBody = {
      reportRequests: [
        {
          viewId: viewId,
          dateRanges: [
            {
              startDate: '7daysAgo',
              endDate: 'today'
            }
          ],
          metrics: [
            { expression: 'ga:users' },
            { expression: 'ga:sessions' },
            { expression: 'ga:pageviews' },
            { expression: 'ga:avgSessionDuration' },
            { expression: 'ga:bounceRate' }
          ],
          dimensions: [
            { name: 'ga:pagePath' }
          ],
          orderBys: [
            {
              fieldName: 'ga:pageviews',
              sortOrder: 'DESCENDING'
            }
          ],
          pageSize: 10
        }
      ]
    };

    const response = await fetch(analyticsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Analytics API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch analytics data', details: errorText }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('Google Analytics response:', JSON.stringify(data, null, 2));
    
    // Transform the data to match our expected format
    const report = data.reports?.[0];
    const rows = report?.data?.rows || [];
    
    const transformedData = {
      users: parseInt(report?.data?.totals?.[0]?.values?.[0] || '0'),
      sessions: parseInt(report?.data?.totals?.[0]?.values?.[1] || '0'),
      pageviews: parseInt(report?.data?.totals?.[0]?.values?.[2] || '0'),
      avgSessionDuration: formatDuration(parseFloat(report?.data?.totals?.[0]?.values?.[3] || '0')),
      bounceRate: `${parseFloat(report?.data?.totals?.[0]?.values?.[4] || '0').toFixed(1)}%`,
      topPages: rows.slice(0, 5).map((row: any) => ({
        page: row.dimensions[0],
        views: parseInt(row.metrics[0].values[2])
      }))
    };

    return new Response(
      JSON.stringify(transformedData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in google-analytics-api function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}