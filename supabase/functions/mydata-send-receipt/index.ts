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
    const { receipt, paymentMethod = 'cash' } = await req.json()

    console.log('🚀 MyData Send Receipt called')

    // Δημιουργία Supabase client για να διαβάσουμε τα credentials από τη βάση
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Λήψη credentials από τον πίνακα mydata_settings
    const { data: settings, error: settingsError } = await supabase
      .from('mydata_settings')
      .select('*')
      .limit(1)
      .single()

    if (settingsError || !settings) {
      console.error('❌ Failed to get MyData settings:', settingsError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Δεν βρέθηκαν ρυθμίσεις MyData. Παρακαλώ διαμορφώστε τις ρυθμίσεις.',
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!settings.enabled) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Το MyData είναι απενεργοποιημένο. Ενεργοποιήστε το από τις ρυθμίσεις.',
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aadeUserId = settings.aade_user_id
    const subscriptionKey = settings.subscription_key
    const vatNumber = settings.vat_number
    const environment = settings.environment || 'production'

    console.log('🔑 Using MyData credentials from database:', { 
      aadeUserId: aadeUserId ? aadeUserId.substring(0, 4) + '***' : 'missing',
      vatNumber: vatNumber ? vatNumber.substring(0, 4) + '***' : 'missing',
      environment,
      hasSubscriptionKey: !!subscriptionKey
    })

    if (!vatNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Δεν έχει οριστεί ΑΦΜ στις ρυθμίσεις MyData.',
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!receipt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid receipt data',
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // MyData API URLs σύμφωνα με την τεκμηρίωση ΑΑΔΕ v1.0.8
    const myDataUrl = environment === 'development' 
      ? 'https://mydataapidev.aade.gr/SendInvoices'
      : 'https://mydatapi.aade.gr/myDATA/SendInvoices'
    
    // Helper functions
    const roundToTwoDecimals = (value: number): number => Math.round(value * 100) / 100

    const getPaymentTypeCode = (method: string): string => {
      const paymentCodes: Record<string, string> = {
        'cash': '3',
        'card': '7',
        'pos': '7',
        'bank_transfer': '1',
        'domestic_transfer': '5',
        'foreign_transfer': '6',
        'iris': '8'
      }
      return paymentCodes[method] || '3'
    }

    // Counterpart XML (για τιμολόγια)
    const counterpartXml = receipt.counterpart?.vatNumber && receipt.counterpart.vatNumber !== "000000000"
      ? `<counterpart>
           <vatNumber>${receipt.counterpart.vatNumber}</vatNumber>
           <country>${receipt.counterpart.country || 'GR'}</country>
           <branch>${receipt.counterpart.branch || 0}</branch>
         </counterpart>`
      : ''

    // Για την πλατφόρμα: ΑΠΥ (11.2) και σειρά ANEY (σύμφωνα με απαίτηση)
    // Σημείωση: Το UI μπορεί να στέλνει διαφορετικές τιμές, αλλά για να είναι συνεπές στο myDATA
    // επιβάλλουμε εδώ τις τιμές που θες.
    const invoiceType = '11.2'
    const series = 'ANEY'
    const classificationType = receipt.classificationType || 'E3_561_003'
    const classificationCategory = receipt.classificationCategory || 'category1_3'

    // XML Body - Χρησιμοποιούμε ΠΑΝΤΑ το VAT number από τη βάση (settings)
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0" 
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:icls="https://www.aade.gr/myDATA/incomeClassificaton/v1.0">
  <invoice>
    <issuer>
      <vatNumber>${vatNumber}</vatNumber>
      <country>GR</country>
      <branch>0</branch>
    </issuer>
    ${counterpartXml}
    <invoiceHeader>
      <series>${series}</series>
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

    console.log('📡 Sending to MyData:', {
      url: myDataUrl,
      issuerVat: vatNumber,
      invoiceType,
      series,
      aa: receipt.invoiceHeader.aa,
      totalGrossValue: receipt.invoiceSummary.totalGrossValue
    })

    const myDataResponse = await fetch(myDataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'aade-user-id': aadeUserId,
        'ocp-apim-subscription-key': subscriptionKey
      },
      body: xmlBody
    })

    const responseText = await myDataResponse.text()
    console.log('📨 MyData Response Status:', myDataResponse.status)
    console.log('📨 MyData Response Body:', responseText)

    if (!myDataResponse.ok) {
      throw new Error(`MyData API Error: ${myDataResponse.status} - ${responseText}`)
    }

    // Parse XML response
    const statusCodeMatch = responseText.match(/<statusCode>(.*?)<\/statusCode>/)
    const statusCode = statusCodeMatch ? statusCodeMatch[1] : null

    if (responseText.includes('<statusCode>Success</statusCode>')) {
      const uidMatch = responseText.match(/<invoiceUid>(.*?)<\/invoiceUid>/)
      const markMatch = responseText.match(/<invoiceMark>(.*?)<\/invoiceMark>/)
      const authCodeMatch = responseText.match(/<authenticationCode>(.*?)<\/authenticationCode>/)
      const qrUrlMatch = responseText.match(/<qrUrl>(.*?)<\/qrUrl>/)

      const result = {
        success: true,
        invoiceUid: uidMatch ? uidMatch[1] : null,
        invoiceMark: markMatch ? markMatch[1] : null,
        authenticationCode: authCodeMatch ? authCodeMatch[1] : null,
        qrUrl: qrUrlMatch ? qrUrlMatch[1] : null,
        message: 'Απόδειξη στάλθηκε επιτυχώς στο MyData',
        receiptNumber: `${series}${receipt.invoiceHeader.aa}`,
        timestamp: new Date().toISOString()
      }

      console.log('✅ MyData Success:', result)

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Extract errors
      const errorMatches = [...responseText.matchAll(/<message>(.*?)<\/message>/g)]
      const errors = errorMatches.map(m => m[1])
      
      throw new Error(`MyData API Error: ${errors.join(', ') || 'Unknown error'}`)
    }

  } catch (error: any) {
    console.error('❌ MyData error:', error.message)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
