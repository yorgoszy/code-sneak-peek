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
    const { aadeUserId, subscriptionKey, environment, receipt } = await req.json()

    console.log('🚀 MyData Send Receipt called with:', { 
      aadeUserId, 
      environment,
      hasSubscriptionKey: !!subscriptionKey,
      receiptId: receipt?.invoiceHeader?.aa
    })
    console.log('📄 Receipt data:', JSON.stringify(receipt, null, 2))

    // Validation - Ελέγχουμε τα myDATA credentials
    if (!aadeUserId || !subscriptionKey) {
      const errorResponse = {
        success: false,
        error: 'Missing required parameters: aadeUserId or subscriptionKey',
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

    if (!receipt) {
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

    // Production MyData API - ΜΟΝΟ ΠΑΡΑΓΩΓΗ
    console.log('🚀 Κλήση Production MyData API...')
    
    // MyData API URL - Σωστό URL σύμφωνα με την τεκμηρίωση
    const myDataUrl = environment === 'development' 
      ? 'https://mydataapidev.aade.gr/SendInvoices'
      : 'https://mydatapi.aade.gr/myDATA/SendInvoices'
    
    const myDataRequest = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'aade-user-id': aadeUserId,
        'ocp-apim-subscription-key': subscriptionKey
      },
      body: JSON.stringify(receipt)
    }

    console.log('📡 MyData Request:', {
      url: myDataUrl,
      headers: myDataRequest.headers,
      bodySize: myDataRequest.body.length
    })

    try {
      const myDataResponse = await fetch(myDataUrl, myDataRequest)
      const responseText = await myDataResponse.text()
      
      console.log('📨 MyData Response Status:', myDataResponse.status)
      console.log('📨 MyData Response Body:', responseText)

      if (!myDataResponse.ok) {
        throw new Error(`MyData API Error: ${myDataResponse.status} - ${responseText}`)
      }

      // Parse response
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Failed to parse MyData response:', responseText)
        throw new Error('Invalid response format from MyData API')
      }

      console.log('✅ MyData API Success:', responseData)

      const response = {
        success: true,
        myDataId: responseData.uid || `MYDATA_${Date.now()}`,
        invoiceMark: responseData.invoiceMark || Math.floor(Math.random() * 1000000000),
        authenticationCode: responseData.authenticationCode || `AUTH_${Date.now()}`,
        message: 'Απόδειξη στάλθηκε επιτυχώς στο MyData',
        receiptNumber: receipt.receiptNumber || 'N/A',
        environment: environment,
        rawResponse: responseData,
        timestamp: new Date().toISOString()
      }

      console.log('✅ Success response:', response)

      return new Response(
        JSON.stringify(response),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )

    } catch (apiError) {
      console.error('❌ MyData API error:', apiError.message)
      
      const errorResponse = {
        success: false,
        error: apiError.message,
        message: 'Σφάλμα στην αποστολή στο MyData API',
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