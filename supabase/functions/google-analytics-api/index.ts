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

    // Google Analytics Data API v1 endpoint για GA4
    const analyticsUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    
    const requestBody = {
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today'
        }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      dimensions: [
        { name: 'pagePath' }
      ],
      orderBys: [
        {
          metric: {
            metricName: 'screenPageViews'
          },
          desc: true
        }
      ],
      limit: 10
    };

    console.log('Calling GA4 API with:', { propertyId, apiKey: apiKey ? 'Present' : 'Missing' });

    const response = await fetch(analyticsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody)
    });

    console.log('GA4 API Response status:', response.status);

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
    console.log('GA4 API Response data:', JSON.stringify(data, null, 2));
    
    // Transform the data to match our expected format
    const transformedData = {
      users: parseInt(data.rows?.[0]?.metricValues?.[0]?.value || '0'),
      sessions: parseInt(data.rows?.[0]?.metricValues?.[1]?.value || '0'),
      pageviews: parseInt(data.rows?.[0]?.metricValues?.[2]?.value || '0'),
      avgSessionDuration: formatDuration(parseFloat(data.rows?.[0]?.metricValues?.[3]?.value || '0')),
      bounceRate: `${(parseFloat(data.rows?.[0]?.metricValues?.[4]?.value || '0') * 100).toFixed(1)}%`,
      topPages: data.rows?.slice(0, 5).map((row: any) => ({
        page: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[2].value)
      })) || []
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