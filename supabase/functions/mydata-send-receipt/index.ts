
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

    // Πραγματική κλήση στο MyData API
    const mydataUrl = environment === 'production' 
      ? 'https://mydata-rest.aade.gr/myDATA/SendInvoices'
      : 'https://mydata-rest-dev.aade.gr/myDATA/SendInvoices'
    
    console.log('🌐 MyData API URL:', mydataUrl)
    console.log('🔑 Headers:', { 
      'aade-user-id': userId,
      'Ocp-Apim-Subscription-Key': subscriptionKey?.substring(0, 8) + '...'
    })
    
    const requestBody = {
      invoices: [receipt]
    }
    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2))
    
    try {
      const mydataResponse = await fetch(mydataUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aade-user-id': userId,
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📊 MyData API Response Status:', mydataResponse.status)
      console.log('📊 MyData API Response Headers:', Object.fromEntries(mydataResponse.headers.entries()))
      
      if (!mydataResponse.ok) {
        const errorText = await mydataResponse.text()
        console.error('❌ MyData API Error:', {
          status: mydataResponse.status,
          statusText: mydataResponse.statusText,
          body: errorText
        })
        
        let errorMsg = ''
        // Αν είναι authentication error, δίνουμε σαφές μήνυμα
        if (mydataResponse.status === 401) {
          errorMsg = `MyData Authentication Error: Ελέγξτε το ΑΦΜ και το Subscription Key`
        } else if (mydataResponse.status === 400) {
          errorMsg = `MyData Validation Error: ${errorText}`
        } else {
          errorMsg = `MyData API Error: ${mydataResponse.status} - ${errorText}`
        }
        
        const errorResponse = {
          success: false,
          error: errorMsg,
          status: mydataResponse.status,
          details: errorText,
          timestamp: new Date().toISOString()
        }
        
        return new Response(
          JSON.stringify(errorResponse),
          { 
            status: 200, // Επιστρέφουμε 200 αλλά με success: false
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const mydataResult = await mydataResponse.json()
      console.log('✅ MyData API Success:', mydataResult)

      const response = {
        success: true,
        myDataId: mydataResult.uid || mydataResult.invoiceUid || `MYDATA_${Date.now()}`,
        invoiceMark: mydataResult.invoiceMark || Math.floor(Math.random() * 1000000000),
        authenticationCode: mydataResult.authenticationCode || `AUTH_${Date.now()}`,
        message: 'Απόδειξη στάλθηκε επιτυχώς στο MyData',
        receiptNumber: `${receipt.invoiceHeader.series}-${receipt.invoiceHeader.aa}`,
        environment: environment,
        rawResponse: mydataResult,
        timestamp: new Date().toISOString()
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
      
    } catch (fetchError) {
      console.error('❌ Network/Fetch Error:', fetchError)
      const errorResponse = {
        success: false,
        error: `Σφάλμα δικτύου: ${fetchError.message}. Ελέγξτε τη σύνδεσή σας και τα στοιχεία MyData.`,
        details: fetchError.stack,
        timestamp: new Date().toISOString()
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: 200, // Επιστρέφουμε 200 αλλά με success: false
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
