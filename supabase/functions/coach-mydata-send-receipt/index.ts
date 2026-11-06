import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3'

// Sends one coach/club/federation receipt to AADE myDATA (production) using that owner's own credentials.
const MYDATA_URL = 'https://mydatapi.aade.gr/myDATA/SendInvoices'
const VAT_RATES: Record<number, number> = { 1: 24, 2: 13, 3: 6, 4: 17, 5: 9, 6: 4, 7: 0, 8: 0 }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const r2 = (n: number) => Math.round(n * 100) / 100

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  let receiptId: string | null = null
  const fail = async (error: string, status = 400) => {
    if (receiptId) await supabase.from('coach_receipts').update({ mydata_status: 'error', mydata_error: error }).eq('id', receiptId)
    return json({ success: false, error }, status)
  }

  try {
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!token) return json({ success: false, error: 'Unauthorized' }, 401)
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return json({ success: false, error: 'Unauthorized' }, 401)

    const parsed = z.object({ receiptId: z.string().uuid(), auto: z.boolean().optional() }).safeParse(await req.json())
    if (!parsed.success) return json({ success: false, error: 'Invalid request' }, 400)

    const { data: caller } = await supabase.from('app_users').select('id').eq('auth_user_id', user.id).maybeSingle()
    const { data: receipt } = await supabase.from('coach_receipts').select('*').eq('id', parsed.data.receiptId).maybeSingle()
    if (!caller || !receipt) return json({ success: false, error: 'Η απόδειξη δεν βρέθηκε' }, 404)

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    if (receipt.coach_id !== caller.id && !isAdmin) return json({ success: false, error: 'Forbidden' }, 403)
    if (receipt.mark) return json({ success: true, invoiceMark: receipt.mark, alreadySent: true })

    const [{ data: settings }, { data: cred }] = await Promise.all([
      supabase.from('coach_mydata_settings').select('*').eq('coach_id', receipt.coach_id).maybeSingle(),
      supabase.from('coach_mydata_credentials').select('aade_user_id, subscription_key').eq('coach_id', receipt.coach_id).maybeSingle(),
    ])

    // Automatic sends silently skip owners who have not enabled auto-send.
    if (parsed.data.auto && !(settings?.enabled && settings?.auto_send)) return json({ success: false, skipped: true })

    receiptId = receipt.id
    if (!settings?.enabled) return await fail('Το myDATA δεν είναι ενεργοποιημένο για αυτόν τον λογαριασμό.')
    if (!settings.vat_number) return await fail('Δεν έχει οριστεί ΑΦΜ στα στοιχεία myDATA.')
    if (!cred?.aade_user_id || !cred?.subscription_key) return await fail('Λείπουν τα στοιχεία σύνδεσης ΑΑΔΕ (User ID / Subscription Key).')

    const vatCategory = Number(settings.vat_category || 1)
    const rate = VAT_RATES[vatCategory] ?? 24
    const gross = r2(Number(receipt.amount) || 0)
    const net = r2(gross / (1 + rate / 100))
    const vat = r2(gross - net)
    const series = settings.receipt_series || 'A'
    const aa = (String(receipt.receipt_number || '').match(/\d+/g) || []).join('') || String(Date.now())
    const issueDate = String(receipt.created_at).slice(0, 10)
    const branch = Number(settings.branch || 0)
    const exemption = vatCategory === 7 && settings.vat_exemption_category
      ? `<vatExemptionCategory>${esc(settings.vat_exemption_category)}</vatExemptionCategory>` : ''
    const cls = `<icls:classificationType>E3_561_003</icls:classificationType><icls:classificationCategory>category1_3</icls:classificationCategory><icls:amount>${net}</icls:amount>`

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:icls="https://www.aade.gr/myDATA/incomeClassificaton/v1.0">
  <invoice>
    <issuer><vatNumber>${esc(settings.vat_number)}</vatNumber><country>GR</country><branch>${branch}</branch></issuer>
    <invoiceHeader><series>${esc(series)}</series><aa>${esc(aa)}</aa><issueDate>${esc(issueDate)}</issueDate><invoiceType>11.2</invoiceType><currency>EUR</currency></invoiceHeader>
    <paymentMethods><paymentMethodDetails><type>3</type><amount>${gross}</amount></paymentMethodDetails></paymentMethods>
    <invoiceDetails><lineNumber>1</lineNumber><netValue>${net}</netValue><vatCategory>${vatCategory}</vatCategory><vatAmount>${vat}</vatAmount>${exemption}<incomeClassification>${cls}</incomeClassification></invoiceDetails>
    <invoiceSummary><totalNetValue>${net}</totalNetValue><totalVatAmount>${vat}</totalVatAmount><totalWithheldAmount>0</totalWithheldAmount><totalFeesAmount>0</totalFeesAmount><totalStampDutyAmount>0</totalStampDutyAmount><totalOtherTaxesAmount>0</totalOtherTaxesAmount><totalDeductionsAmount>0</totalDeductionsAmount><totalGrossValue>${gross}</totalGrossValue><incomeClassification>${cls}</incomeClassification></invoiceSummary>
  </invoice>
</InvoicesDoc>`

    const res = await fetch(MYDATA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml', 'aade-user-id': cred.aade_user_id, 'ocp-apim-subscription-key': cred.subscription_key },
      body: xml,
    })
    const text = await res.text()

    if (text.includes('<statusCode>Success</statusCode>')) {
      const mark = text.match(/<invoiceMark>(.*?)<\/invoiceMark>/)?.[1] ?? null
      const uid = text.match(/<invoiceUid>(.*?)<\/invoiceUid>/)?.[1] ?? null
      await supabase.from('coach_receipts').update({ mark, mydata_uid: uid, mydata_status: 'sent', mydata_error: null, mydata_sent_at: new Date().toISOString() }).eq('id', receipt.id)
      if (!settings.connection_verified_at) await supabase.from('coach_mydata_settings').update({ connection_verified_at: new Date().toISOString() }).eq('coach_id', receipt.coach_id)
      return json({ success: true, invoiceMark: mark })
    }

    const msgs = [...text.matchAll(/<message>(.*?)<\/message>/g)].map((m) => m[1])
    const error = msgs.join(', ') || (res.status === 401 ? 'Λάθος στοιχεία σύνδεσης ΑΑΔΕ' : `Σφάλμα ΑΑΔΕ (${res.status})`)
    return await fail(error, 200)
  } catch (e) {
    console.error('coach-mydata-send-receipt error', e)
    return await fail(e instanceof Error ? e.message : 'Άγνωστο σφάλμα', 500)
  }
})
