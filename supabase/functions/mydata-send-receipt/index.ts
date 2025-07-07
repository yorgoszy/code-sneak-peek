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

    console.log('🚀 MyData Send Receipt called with:', { 
      userId, 
      environment,
      hasSubscriptionKey: !!subscriptionKey,
      receiptId: receipt?.invoiceHeader?.aa
    })
    console.log('📄 Receipt data:', JSON.stringify(receipt, null, 2))

    // Validation
    if (!userId || !subscriptionKey) {
      const errorResponse = {
        success: false,
        error: 'Missing required parameters: userId or subscriptionKey',
        timestamp: new Date().toISOString()
      }
      console.error('❌ Validation error:', errorResponse.error)
      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (!receipt || !receipt.invoiceHeader) {
      const errorResponse = {
        success: false,
        error: 'Invalid receipt data',
        timestamp: new Date().toISOString()
      }
      console.error('❌ Validation error:', errorResponse.error)
      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Προσομοίωση MyData API για demo σκοπούς
    console.log('🎭 Demo Mode: Simulating MyData API call...')
    
    // Για demo, επιστρέφουμε πάντα επιτυχία
    const mockResponse = {
      uid: `DEMO_${Date.now()}`,
      invoiceMark: Math.floor(Math.random() * 1000000000),
      authenticationCode: `AUTH_DEMO_${Date.now()}`,
      success: true
    }

    console.log('✅ Mock MyData API Success:', mockResponse)

    const response = {
      success: true,
      myDataId: mockResponse.uid,
      invoiceMark: mockResponse.invoiceMark,
      authenticationCode: mockResponse.authenticationCode,
      message: 'Απόδειξη στάλθηκε επιτυχώς στο MyData (Demo Mode)',
      receiptNumber: `${receipt.invoiceHeader.series}-${receipt.invoiceHeader.aa}`,
      environment: environment,
      rawResponse: mockResponse,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Demo response:', response)

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
    console.error('❌ MyData error:', error.message, error.stack)
    
    const errorResponse = {
      success: false,
      error: error.message,
      details: error.stack,
      timestamp: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})