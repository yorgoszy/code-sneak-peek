import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { projectId, dateRange } = await req.json()
    
    const clarityApiKey = Deno.env.get('MICROSOFT_CLARITY_API_KEY')
    if (!clarityApiKey) {
      return new Response(
        JSON.stringify({ error: 'Microsoft Clarity API key not configured' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🔍 Fetching Clarity analytics for project:', projectId)

    // Fetch overview data από Clarity API
    const overviewResponse = await fetch(
      `https://www.clarity.ms/api/overview/${projectId}?start=${dateRange.start}&end=${dateRange.end}`,
      {
        headers: {
          'Authorization': `Bearer ${clarityApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!overviewResponse.ok) {
      throw new Error(`Clarity API error: ${overviewResponse.status}`)
    }

    const overviewData = await overviewResponse.json()

    // Fetch heatmaps data
    const heatmapsResponse = await fetch(
      `https://www.clarity.ms/api/heatmaps/${projectId}?start=${dateRange.start}&end=${dateRange.end}`,
      {
        headers: {
          'Authorization': `Bearer ${clarityApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const heatmapsData = heatmapsResponse.ok ? await heatmapsResponse.json() : null

    // Μετατροπή δεδομένων για την εφαρμογή μας
    const analytics = {
      visitors: overviewData.uniqueUsers || 0,
      pageViews: overviewData.pageViews || 0,
      avgSessionDuration: formatDuration(overviewData.avgSessionDuration || 0),
      bounceRate: `${Math.round(overviewData.bounceRate * 100) || 0}%`,
      topPages: overviewData.topPages?.map((page: any) => ({
        page: page.url,
        views: page.pageViews
      })) || [],
      deviceTypes: [
        { type: 'Desktop', percentage: Math.round(overviewData.desktopPercentage * 100) || 0 },
        { type: 'Mobile', percentage: Math.round(overviewData.mobilePercentage * 100) || 0 },
        { type: 'Tablet', percentage: Math.round(overviewData.tabletPercentage * 100) || 0 }
      ],
      trafficSources: overviewData.trafficSources?.map((source: any) => ({
        source: source.name,
        percentage: Math.round(source.percentage * 100)
      })) || [],
      heatmapsCount: heatmapsData?.count || 0,
      recordingsCount: overviewData.recordingsCount || 0
    }

    console.log('✅ Successfully fetched Clarity analytics')

    return new Response(
      JSON.stringify({
        success: true,
        data: analytics
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error fetching Clarity analytics:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch analytics data', 
        details: error.message 
      }),
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