import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts"

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

    // Check if it's a Measurement ID (starts with G-) instead of Property ID
    if (propertyId.startsWith('G-')) {
      return new Response(
        JSON.stringify({ 
          error: 'Χρειάζεστε το numeric Property ID, όχι το Measurement ID', 
          details: `Το "${propertyId}" είναι Measurement ID. Χρειάζεστε το numeric Property ID από το Google Analytics > Admin > Property Settings > Property Details.`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }


    // Get Google Service Account JSON from Supabase secrets
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    
    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({ error: 'Google Service Account JSON not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    try {
      // Parse the service account JSON
      const serviceAccount = JSON.parse(serviceAccountJson)
      console.log('✅ Service Account loaded successfully')

      // Import private key for JWT signing
      const privateKeyPem = serviceAccount.private_key
      
      // Convert PEM to proper format for Web Crypto API
      const pemHeader = "-----BEGIN PRIVATE KEY-----"
      const pemFooter = "-----END PRIVATE KEY-----"
      const pemContents = privateKeyPem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "")
      
      // Decode base64 to ArrayBuffer
      const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
      
      // Import the private key for signing
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      )

      // Create JWT payload
      const now = getNumericDate(new Date())
      const exp = getNumericDate(new Date(Date.now() + 3600 * 1000)) // 1 hour
      
      const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: exp,
        iat: now
      }

      // Create and sign JWT
      const jwt = await create({ alg: "RS256", typ: "JWT" }, payload, cryptoKey)

      // Get access token from Google
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('❌ Token exchange failed:', errorText)
        throw new Error(`Token exchange failed: ${errorText}`)
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token

      console.log('✅ Access token obtained successfully')

      // Make request to Google Analytics Data API
      const analyticsUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`
      
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
      }

      console.log('📊 Making request to Google Analytics Data API...')

      const analyticsResponse = await fetch(analyticsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!analyticsResponse.ok) {
        const errorText = await analyticsResponse.text()
        console.error('❌ Analytics API error:', errorText)
        throw new Error(`Analytics API error: ${errorText}`)
      }

      const analyticsData = await analyticsResponse.json()
      console.log('✅ Real Analytics data received successfully')

      // Transform the data to match our expected format
      const rows = analyticsData.rows || []
      const totals = analyticsData.totals?.[0]?.metricValues || []

      const transformedData = {
        users: parseInt(totals[0]?.value || '0'),
        sessions: parseInt(totals[1]?.value || '0'),
        pageviews: parseInt(totals[2]?.value || '0'),
        avgSessionDuration: formatDuration(parseFloat(totals[3]?.value || '0')),
        bounceRate: `${(parseFloat(totals[4]?.value || '0') * 100).toFixed(1)}%`,
        topPages: rows.slice(0, 5).map((row: any) => ({
          page: row.dimensionValues?.[0]?.value || 'Unknown',
          views: parseInt(row.metricValues?.[2]?.value || '0')
        }))
      }

      console.log('📈 Transformed analytics data:', transformedData)

      return new Response(
        JSON.stringify(transformedData),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      console.error('❌ Error processing Google Analytics request:', error)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Google Analytics data', 
          details: error.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

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