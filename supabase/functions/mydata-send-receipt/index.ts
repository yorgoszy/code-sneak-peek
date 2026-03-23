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
    // Authentication check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Δημιουργία Supabase client για auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify caller is admin or coach
    const { data: callerProfile } = await supabase
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!callerProfile || !['admin', 'coach'].includes(callerProfile.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Admin or Coach access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { receipt, paymentMethod = 'cash' } = await req.json()

    console.log('🚀 MyData Send Receipt called by user:', user.id)

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
    const escapeXml = (val: unknown): string =>
      String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

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
           <vatNumber>${escapeXml(receipt.counterpart.vatNumber)}</vatNumber>
           <country>${escapeXml(receipt.counterpart.country || 'GR')}</country>
           <branch>${escapeXml(receipt.counterpart.branch || 0)}</branch>
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
      <vatNumber>${escapeXml(vatNumber)}</vatNumber>
      <country>GR</country>
      <branch>0</branch>
    </issuer>
    ${counterpartXml}
    <invoiceHeader>
      <series>${escapeXml(series)}</series>
      <aa>${escapeXml(receipt.invoiceHeader.aa)}</aa>
      <issueDate>${escapeXml(receipt.invoiceHeader.issueDate)}</issueDate>
      <invoiceType>${escapeXml(invoiceType)}</invoiceType>
      <currency>${escapeXml(receipt.invoiceHeader.currency || 'EUR')}</currency>
    </invoiceHeader>
    <paymentMethods>
      <paymentMethodDetails>
        <type>${escapeXml(getPaymentTypeCode(paymentMethod))}</type>
        <amount>${roundToTwoDecimals(receipt.invoiceSummary.totalGrossValue)}</amount>
      </paymentMethodDetails>
    </paymentMethods>
    ${receipt.invoiceDetails.map((detail: any) => `
    <invoiceDetails>
      <lineNumber>${escapeXml(detail.lineNumber)}</lineNumber>
      <netValue>${roundToTwoDecimals(detail.netValue)}</netValue>
      <vatCategory>${escapeXml(detail.vatCategory)}</vatCategory>
      <vatAmount>${roundToTwoDecimals(detail.vatAmount)}</vatAmount>
      <incomeClassification>
        <icls:classificationType>${escapeXml(classificationType)}</icls:classificationType>
        <icls:classificationCategory>${escapeXml(classificationCategory)}</icls:classificationCategory>
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
