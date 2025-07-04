import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, subscriptionKey, environment, receipt } = await req.json()

    console.log('🚀 MyData Send Receipt called with:', { userId, environment })
    console.log('📄 Receipt data:', receipt)

    // Προσομοίωση επιτυχημένης αποστολής στο MyData
    // Σε πραγματική εφαρμογή θα γινόταν κλήση στο MyData API
    const response = {
      success: true,
      myDataId: `MYDATA_${Date.now()}`,
      invoiceMark: Math.floor(Math.random() * 1000000000),
      authenticationCode: `AUTH_${Date.now()}`,
      message: 'Απόδειξη στάλθηκε επιτυχώς στο MyData'
    }

    console.log('✅ MyData response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ MyData error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})