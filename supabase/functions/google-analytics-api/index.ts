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
    
    // Δημιουργία πιο σταθερών demo δεδομένων
    // Χρησιμοποιούμε το propertyId για seed για συνοχή
    const seed = propertyId ? propertyId.charCodeAt(propertyId.length - 1) : 1;
    const baseUsers = 1250 + (seed * 10);
    const baseSessions = baseUsers * 1.6;
    const basePageviews = baseSessions * 2.8;
    
    // Προσθέτουμε μικρή τυχαιότητα (±10%) για φυσικότητα
    const randomVariation = (base: number) => {
      const variation = (Math.random() - 0.5) * 0.2; // ±10%
      return Math.floor(base * (1 + variation));
    };
    
    const mockData = {
      users: randomVariation(baseUsers),
      sessions: randomVariation(baseSessions),
      pageviews: randomVariation(basePageviews),
      avgSessionDuration: formatDuration(180 + (seed * 5)),
      bounceRate: `${(42.5 + (seed % 10)).toFixed(1)}%`,
      topPages: [
        { page: '/', views: 650 + (seed * 20) },
        { page: '/dashboard', views: 420 + (seed * 15) },
        { page: '/programs', views: 380 + (seed * 12) },
        { page: '/exercises', views: 290 + (seed * 8) },
        { page: '/results', views: 180 + (seed * 5) }
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