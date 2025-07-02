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

    // Για demo σκοπούς, επιστρέφουμε mock data
    // Στην πραγματικότητα το Google Analytics Data API χρειάζεται OAuth2 authentication
    console.log('Property ID received:', propertyId);
    console.log('API Key received:', apiKey ? 'Present' : 'Missing');
    
    // Mock δεδομένα που μοιάζουν με πραγματικά Google Analytics data
    const mockData = {
      users: Math.floor(Math.random() * 5000) + 1000,
      sessions: Math.floor(Math.random() * 8000) + 2000,
      pageviews: Math.floor(Math.random() * 15000) + 5000,
      avgSessionDuration: formatDuration(Math.floor(Math.random() * 300) + 60),
      bounceRate: `${(Math.random() * 30 + 20).toFixed(1)}%`,
      topPages: [
        { page: '/', views: Math.floor(Math.random() * 1000) + 500 },
        { page: '/dashboard', views: Math.floor(Math.random() * 800) + 300 },
        { page: '/programs', views: Math.floor(Math.random() * 600) + 200 },
        { page: '/exercises', views: Math.floor(Math.random() * 400) + 150 },
        { page: '/results', views: Math.floor(Math.random() * 300) + 100 }
      ]
    };

    return new Response(
      JSON.stringify(mockData),
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