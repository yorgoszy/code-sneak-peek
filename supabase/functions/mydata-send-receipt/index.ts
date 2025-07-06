
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
      throw new Error('Missing required parameters: userId or subscriptionKey')
    }

    if (!receipt || !receipt.invoiceHeader) {
      throw new Error('Invalid receipt data')
    }

    // Προσομοίωση κλήσης στο πραγματικό MyData API
    // Σε πραγματική εφαρμογή θα γινόταν:
    // const mydataUrl = environment === 'production' 
    //   ? 'https://mydata-rest.aade.gr/myDATA/SendInvoices'
    //   : 'https://mydata-rest-dev.aade.gr/myDATA/SendInvoices'
    
    // const mydataResponse = await fetch(mydataUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'aade-user-id': userId,
    //     'Ocp-Apim-Subscription-Key': subscriptionKey
    //   },
    //   body: JSON.stringify({
    //     invoices: [receipt]
    //   })
    // })

    // Προσομοίωση επιτυχημένης αποστολής
    const response = {
      success: true,
      myDataId: `MYDATA_${Date.now()}`,
      invoiceMark: Math.floor(Math.random() * 1000000000),
      authenticationCode: `AUTH_${Date.now()}`,
      message: 'Απόδειξη στάλθηκε επιτυχώς στο MyData',
      receiptNumber: `${receipt.invoiceHeader.series}-${receipt.invoiceHeader.aa}`,
      environment: environment
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
    console.error('❌ MyData error:', error.message, error.stack)
    
    const errorResponse = {
      success: false,
      error: error.message,
      details: error.stack
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
