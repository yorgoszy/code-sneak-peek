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
    const { userId, subscriptionKey, environment, receipt } = await req.json()
    
    if (!userId || !subscriptionKey || !receipt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const apiUrl = environment === 'production' 
      ? 'https://mydatapi.aade.gr/myDATA/SendInvoices'
      : 'https://mydataapidevs.azure-api.net/SendInvoices'

    console.log('🧾 Sending receipt to MyData AADE:', receipt.invoiceHeader)

    // Δημιουργία XML παραστατικού για MyData
    const invoiceXml = `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0" 
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://www.aade.gr/myDATA/invoice/v1.0/InvoicesDoc-v1.0.xsd">
  <invoice>
    <issuer>
      <vatNumber>${receipt.issuer.vatNumber}</vatNumber>
      <country>${receipt.issuer.country}</country>
      <branch>${receipt.issuer.branch}</branch>
    </issuer>
    <counterpart>
      <vatNumber>${receipt.counterpart.vatNumber || ''}</vatNumber>
      <country>${receipt.counterpart.country}</country>
    </counterpart>
    <invoiceHeader>
      <series>${receipt.invoiceHeader.series}</series>
      <aa>${receipt.invoiceHeader.aa}</aa>
      <issueDate>${receipt.invoiceHeader.issueDate}</issueDate>
      <invoiceType>${receipt.invoiceHeader.invoiceType}</invoiceType>
      <currency>${receipt.invoiceHeader.currency}</currency>
    </invoiceHeader>
    <invoiceDetails>
      ${receipt.invoiceDetails.map((detail: any) => `
      <invoiceRowType>
        <lineNumber>${detail.lineNumber}</lineNumber>
        <netValue>${detail.netValue.toFixed(2)}</netValue>
        <vatCategory>${detail.vatCategory}</vatCategory>
        <vatAmount>${detail.vatAmount.toFixed(2)}</vatAmount>
      </invoiceRowType>
      `).join('')}
    </invoiceDetails>
    <invoiceSummary>
      <totalNetValue>${receipt.invoiceSummary.totalNetValue.toFixed(2)}</totalNetValue>
      <totalVatAmount>${receipt.invoiceSummary.totalVatAmount.toFixed(2)}</totalVatAmount>
      <totalWithheldAmount>${receipt.invoiceSummary.totalWithheldAmount.toFixed(2)}</totalWithheldAmount>
      <totalFeesAmount>${receipt.invoiceSummary.totalFeesAmount.toFixed(2)}</totalFeesAmount>
      <totalStampDutyAmount>${receipt.invoiceSummary.totalStampDutyAmount.toFixed(2)}</totalStampDutyAmount>
      <totalOtherTaxesAmount>${receipt.invoiceSummary.totalOtherTaxesAmount.toFixed(2)}</totalOtherTaxesAmount>
      <totalDeductionsAmount>${receipt.invoiceSummary.totalDeductionsAmount.toFixed(2)}</totalDeductionsAmount>
      <totalGrossValue>${receipt.invoiceSummary.totalGrossValue.toFixed(2)}</totalGrossValue>
    </invoiceSummary>
  </invoice>
</InvoicesDoc>`

    // Προσομοίωση αποστολής στο MyData API
    console.log('📤 Sending to MyData API:', apiUrl)
    
    // Για production θα χρησιμοποιούσαμε το πραγματικό API
    // const response = await fetch(apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/xml',
    //     'aade-user-id': userId,
    //     'Ocp-Apim-Subscription-Key': subscriptionKey
    //   },
    //   body: invoiceXml
    // })

    // Mock successful response για demo
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockResponse = {
      response: {
        index: 1,
        invoiceUid: `MYDATA_${Date.now()}`,
        invoiceMark: Math.floor(Math.random() * 1000000000),
        authenticationCode: `AUTH_${Date.now()}`,
        statusCode: "Success"
      }
    }

    console.log('✅ MyData response:', mockResponse)

    return new Response(
      JSON.stringify({
        success: true,
        myDataId: mockResponse.response.invoiceUid,
        invoiceMark: mockResponse.response.invoiceMark,
        authenticationCode: mockResponse.response.authenticationCode,
        message: 'Απόδειξη στάλθηκε επιτυχώς στο MyData'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error sending to MyData:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send receipt to MyData', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})