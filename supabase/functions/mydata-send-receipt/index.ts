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
    const { 
      aadeUserId, 
      subscriptionKey, 
      environment, 
      receipt, 
      paymentMethod = 'cash',
      useStoredCredentials = false // Χρήση των αποθηκευμένων secrets
    } = await req.json()

    // Λήψη credentials - είτε από request είτε από Supabase secrets
    let finalAadeUserId = aadeUserId
    let finalSubscriptionKey = subscriptionKey

    if (useStoredCredentials || (!aadeUserId && !subscriptionKey)) {
      // Χρήση των Supabase secrets
      finalAadeUserId = Deno.env.get('MYDATA_USER_ID') || aadeUserId
      finalSubscriptionKey = Deno.env.get('MYDATA_SUBSCRIPTION_KEY') || subscriptionKey
      console.log('🔑 Using stored Supabase secrets for MyData credentials')
    }

    console.log('🚀 MyData Send Receipt called with:', { 
      aadeUserId: finalAadeUserId ? '***' : 'missing', 
      environment,
      hasSubscriptionKey: !!finalSubscriptionKey,
      receiptId: receipt?.invoiceHeader?.aa,
      useStoredCredentials
    })

    // Validation - Ελέγχουμε τα myDATA credentials
    if (!finalAadeUserId || !finalSubscriptionKey) {
      const errorResponse = {
        success: false,
        error: 'Missing required parameters: aadeUserId or subscriptionKey. Configure them in Supabase secrets or pass them in the request.',
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

    // MyData API URLs σύμφωνα με την τεκμηρίωση ΑΑΔΕ v1.0.8
    // Production: https://mydatapi.aade.gr/myDATA/SendInvoices
    // Development: https://mydataapidev.aade.gr/SendInvoices
    console.log('🚀 Κλήση MyData API...')
    
    const myDataUrl = environment === 'development' 
      ? 'https://mydataapidev.aade.gr/SendInvoices'
      : 'https://mydatapi.aade.gr/myDATA/SendInvoices'
    
    // Helper function για στρογγύλευση τιμών σε 2 δεκαδικά ψηφία
    const roundToTwoDecimals = (value: number): number => {
      return Math.round(value * 100) / 100
    }

    // Helper function για payment type codes σύμφωνα με MyData API
    // Πίνακας 8.12 - Τρόποι Πληρωμής
    const getPaymentTypeCode = (method: string): string => {
      const paymentCodes: Record<string, string> = {
        'cash': '3',              // Μετρητά
        'card': '7',              // POS/e-POS
        'pos': '7',               // POS/e-POS
        'bank_transfer': '1',     // Επιταγή / Τραπεζική κατάθεση
        'domestic_transfer': '5', // Εγχώριες Πληρωμές Λογαριασμού
        'foreign_transfer': '6',  // Web Banking
        'iris': '8'               // Άμεσες Πληρωμές IRIS
      }
      return paymentCodes[method] || '3' // Default μετρητά
    }

    // Δημιουργούμε το τμήμα του counterpart δυναμικά (για τιμολόγια)
    const counterpartXml = receipt.counterpart && receipt.counterpart.vatNumber && receipt.counterpart.vatNumber !== "000000000"
      ? `<counterpart>
           <vatNumber>${receipt.counterpart.vatNumber}</vatNumber>
           <country>${receipt.counterpart.country || 'GR'}</country>
           <branch>${receipt.counterpart.branch || 0}</branch>
         </counterpart>`
      : '';

    // Προσδιορισμός τύπου παραστατικού
    // 11.1 = Απόδειξη Λιανικής Πώλησης
    // 11.2 = Απόδειξη Παροχής Υπηρεσιών
    // 11.4 = Απλοποιημένο Τιμολόγιο
    const invoiceType = receipt.invoiceHeader.invoiceType || '11.1'
    
    // Χαρακτηρισμός εσόδων ανάλογα με τον τύπο
    // E3_561_003 = Λοιπές πωλήσεις αγαθών (για γυμναστήριο = υπηρεσίες)
    // category1_3 = Έσοδα από παροχή υπηρεσιών
    const classificationType = receipt.classificationType || 'E3_561_003'
    const classificationCategory = receipt.classificationCategory || 'category1_3'

    // Μετατροπή σε XML format σύμφωνα με MyData API Documentation v1.0.8
    // ΣΗΜΑΝΤΙΚΟ: Το incomeClassification χρειάζεται το namespace icls
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0" 
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:icls="https://www.aade.gr/myDATA/incomeClassificaton/v1.0">
  <invoice>
    <issuer>
      <vatNumber>${receipt.issuer.vatNumber}</vatNumber>
      <country>${receipt.issuer.country || 'GR'}</country>
      <branch>${receipt.issuer.branch || 0}</branch>
    </issuer>
    ${counterpartXml}
    <invoiceHeader>
      <series>${receipt.invoiceHeader.series}</series>
      <aa>${receipt.invoiceHeader.aa}</aa>
      <issueDate>${receipt.invoiceHeader.issueDate}</issueDate>
      <invoiceType>${invoiceType}</invoiceType>
      <currency>${receipt.invoiceHeader.currency || 'EUR'}</currency>
    </invoiceHeader>
    <paymentMethods>
      <paymentMethodDetails>
        <type>${getPaymentTypeCode(paymentMethod)}</type>
        <amount>${roundToTwoDecimals(receipt.invoiceSummary.totalGrossValue)}</amount>
      </paymentMethodDetails>
    </paymentMethods>
    ${receipt.invoiceDetails.map((detail: any) => `
    <invoiceDetails>
      <lineNumber>${detail.lineNumber}</lineNumber>
      <netValue>${roundToTwoDecimals(detail.netValue)}</netValue>
      <vatCategory>${detail.vatCategory}</vatCategory>
      <vatAmount>${roundToTwoDecimals(detail.vatAmount)}</vatAmount>
      <incomeClassification>
        <icls:classificationType>${classificationType}</icls:classificationType>
        <icls:classificationCategory>${classificationCategory}</icls:classificationCategory>
        <icls:amount>${roundToTwoDecimals(detail.netValue)}</icls:amount>
      </incomeClassification>
    </invoiceDetails>`).join('')}

    <invoiceSummary>
      <totalNetValue>${roundToTwoDecimals(receipt.invoiceSummary.totalNetValue || 0)}</totalNetValue>
      <totalVatAmount>${roundToTwoDecimals(receipt.invoiceSummary.totalVatAmount || 0)}</totalVatAmount>
      <totalWithheldAmount>${roundToTwoDecimals(receipt.invoiceSummary.totalWithheldAmount || 0)}</totalWithheldAmount>
      <totalFeesAmount>${roundToTwoDecimals(receipt.invoiceSummary.totalFeesAmount || 0)}</totalFeesAmount>
      <totalStampDutyAmount>${roundToTwoDecimals(receipt.invoiceSummary.totalStampDutyAmount || 0)}</totalStampDutyAmount>
      <totalOtherTaxesAmount>${roundToTwoDecimals(receipt.invoiceSummary.totalOtherTaxesAmount || 0)}</totalOtherTaxesAmount>
      <totalDeductionsAmount>${roundToTwoDecimals(receipt.invoiceSummary.totalDeductionsAmount || 0)}</totalDeductionsAmount>
      <totalGrossValue>${roundToTwoDecimals(receipt.invoiceSummary.totalGrossValue || 0)}</totalGrossValue>
      <incomeClassification>
        <icls:classificationType>${classificationType}</icls:classificationType>
        <icls:classificationCategory>${classificationCategory}</icls:classificationCategory>
        <icls:amount>${roundToTwoDecimals(receipt.invoiceSummary.totalNetValue || 0)}</icls:amount>
      </incomeClassification>
    </invoiceSummary>
  </invoice>
</InvoicesDoc>`
    
    const myDataRequest = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'aade-user-id': finalAadeUserId,
        'ocp-apim-subscription-key': finalSubscriptionKey
      },
      body: xmlBody
    }

    console.log('📡 MyData Request:', {
      url: myDataUrl,
      headers: {
        'Content-Type': 'application/xml',
        'aade-user-id': '***',
        'ocp-apim-subscription-key': '***'
      },
      bodySize: myDataRequest.body.length,
      invoiceType,
      series: receipt.invoiceHeader.series,
      aa: receipt.invoiceHeader.aa
    })

    try {
      const myDataResponse = await fetch(myDataUrl, myDataRequest)
      const responseText = await myDataResponse.text()
      
      console.log('📨 MyData Response Status:', myDataResponse.status)
      console.log('📨 MyData Response Body:', responseText)

      if (!myDataResponse.ok) {
        throw new Error(`MyData API Error: ${myDataResponse.status} - ${responseText}`)
      }

      // Parse XML response
      let responseData: {
        uid: string | null
        invoiceMark: string | null
        authenticationCode: string | null
        statusCode: string | null
        qrUrl: string | null
        errors: string[]
      } = {
        uid: null,
        invoiceMark: null,
        authenticationCode: null,
        statusCode: null,
        qrUrl: null,
        errors: []
      }

      try {
        // Εξαγωγή statusCode
        const statusCodeMatch = responseText.match(/<statusCode>(.*?)<\/statusCode>/)
        responseData.statusCode = statusCodeMatch ? statusCodeMatch[1] : null
        
        // Έλεγχος αν υπάρχει success response στο XML
        if (responseText.includes('<statusCode>Success</statusCode>')) {
          // Εξαγωγή uid, invoiceMark, authenticationCode και qrUrl από XML
          const uidMatch = responseText.match(/<invoiceUid>(.*?)<\/invoiceUid>/)
          const invoiceMarkMatch = responseText.match(/<invoiceMark>(.*?)<\/invoiceMark>/)
          const authenticationCodeMatch = responseText.match(/<authenticationCode>(.*?)<\/authenticationCode>/)
          const qrUrlMatch = responseText.match(/<qrUrl>(.*?)<\/qrUrl>/)
          
          responseData.uid = uidMatch ? uidMatch[1] : null
          responseData.invoiceMark = invoiceMarkMatch ? invoiceMarkMatch[1] : null
          responseData.authenticationCode = authenticationCodeMatch ? authenticationCodeMatch[1] : null
          responseData.qrUrl = qrUrlMatch ? qrUrlMatch[1] : null
          
          console.log('✅ MyData API Success:', responseData)
        } else {
          // Εξαγωγή σφαλμάτων από XML
          const errorMatches = responseText.matchAll(/<message>(.*?)<\/message>/g)
          for (const match of errorMatches) {
            responseData.errors.push(match[1])
          }
          
          console.error('❌ MyData API returned non-success response:', responseData)
          throw new Error(`MyData API Error: ${responseData.errors.join(', ') || 'Unknown error'}`)
        }
      } catch (parseError: any) {
        if (parseError.message.includes('MyData API Error')) {
          throw parseError
        }
        console.error('❌ Failed to parse MyData response:', responseText)
        throw new Error('Invalid response format from MyData API')
      }

      const response = {
        success: true,
        myDataId: responseData.uid || `MYDATA_${Date.now()}`,
        invoiceUid: responseData.uid,
        invoiceMark: responseData.invoiceMark,
        authenticationCode: responseData.authenticationCode,
        qrUrl: responseData.qrUrl,
        message: 'Απόδειξη στάλθηκε επιτυχώς στο MyData',
        receiptNumber: receipt.invoiceHeader.series + receipt.invoiceHeader.aa,
        invoiceType: invoiceType,
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

    } catch (apiError: any) {
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

  } catch (error: any) {
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