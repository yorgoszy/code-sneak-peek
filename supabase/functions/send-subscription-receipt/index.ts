import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReceiptData {
  userName: string;
  userEmail: string;
  subscriptionType: string;
  price: number;
  startDate: string;
  endDate: string;
  invoiceNumber: string;
}

// Handler για notification αποδείξεων
const handleReceiptNotification = async (requestBody: any) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📧 Χειρισμός receipt notification:', requestBody)

    // Λήψη στοιχείων απόδειξης
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select(`
        *,
        app_users!receipts_user_id_fkey (
          name,
          email
        )
      `)
      .eq('id', requestBody.receiptId)
      .single()

    if (receiptError || !receipt) {
      console.error('❌ Δεν βρέθηκε η απόδειξη:', receiptError)
      return new Response(
        JSON.stringify({ error: 'Δεν βρέθηκε η απόδειξη' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const user = receipt.app_users
    if (!user || !user.email) {
      console.error('❌ Δεν βρέθηκε email χρήστη')
      return new Response(
        JSON.stringify({ error: 'Δεν βρέθηκε email χρήστη' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const resend = new Resend(resendApiKey)

    // Λήψη items από τη σχέση receipt_items
    const { data: receiptItems, error: itemsError } = await supabase
      .from('receipt_items')
      .select('*')
      .eq('receipt_id', receipt.id)

    // Δημιουργία HTML για απόδειξη
    const receiptHTML = generateGeneralReceiptHTML({
      receiptNumber: receipt.receipt_number,
      userName: user.name,
      userEmail: user.email,
      customerName: receipt.customer_name,
      customerVat: receipt.customer_vat,
      total: receipt.total,
      subtotal: receipt.net_amount,
      vatAmount: receipt.tax_amount,
      issueDate: receipt.issue_date,
      startDate: receipt.start_date,
      endDate: receipt.end_date,
      invoiceMark: receipt.invoice_mark,
      description: receipt.description || 'Υπηρεσίες Γυμναστηρίου',
      items: receiptItems || []
    })

    const emailResponse = await resend.emails.send({
      from: 'HYPERKIDS <noreply@hyperkids.gr>',
      to: [user.email],
      subject: `Απόδειξη #${receipt.receipt_number} - HYPERKIDS`,
      html: receiptHTML,
    })

    console.log('✅ Email απόδειξης στάλθηκε επιτυχώς:', emailResponse.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.id,
        message: 'Η απόδειξη στάλθηκε επιτυχώς' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Σφάλμα στο handleReceiptNotification:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Αποτυχία αποστολής απόδειξης', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

const generateGeneralReceiptHTML = (data: any) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Απόδειξη - HYPERKIDS</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; background-color: #ffffff; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 16px; border: 1px solid #e5e7eb; }
            .header { display: flex; align-items: start; justify-content: space-between; border-bottom: 2px solid #00ffba; padding-bottom: 12px; margin-bottom: 16px; }
            .header-left { flex: 1; text-align: left; }
            .header-left p { font-size: 12px; color: #374151; line-height: 1.4; }
            .header-left strong { font-weight: bold; }
            .receipt-title { font-size: 18px; color: #00ffba; text-align: center; margin-bottom: 12px; font-weight: 600; }
            .info-section { margin-bottom: 16px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
            .info-row.two-cols { display: flex; justify-content: space-between; }
            .info-row.two-cols > div { flex: 1; }
            .info-row.two-cols > div:last-child { text-align: right; }
            .label { font-weight: 600; color: #111827; }
            .value { color: #4b5563; }
            .items-section { margin-bottom: 16px; }
            .items-section h3 { font-size: 12px; font-weight: 600; color: #111827; margin-bottom: 8px; }
            .item { border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 8px; }
            .item-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; }
            .item-name { font-weight: 500; color: #111827; font-size: 12px; }
            .item-quantity { color: #4b5563; font-size: 12px; }
            .item-details { display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; }
            .total-section { background: #f9fafb; padding: 12px; border-left: 4px solid #00ffba; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; }
            .total-row.final { border-top: 2px solid #00ffba; padding-top: 8px; margin-top: 12px; }
            .total-row.final .label { font-size: 18px; font-weight: bold; color: #00ffba; }
            .total-row.final .value { font-size: 18px; font-weight: bold; color: #00ffba; }
            .footer { display: flex; justify-content: center; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
            .footer img { width: 50%; height: auto; object-fit: contain; filter: grayscale(100%) brightness(0.9); opacity: 0.4; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="header-left">
                    <p><strong>HYPERKIDS</strong></p>
                    <p><strong>ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ</strong></p>
                    <p>Διεύθυνση: ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46, ΘΕΣΣΑΛΟΝΙΚΗ 54627</p>
                    <p>Email: info@hyperkids.gr | Web: www.hyperkids.gr</p>
                    <p>Τηλ: 2310 529104</p>
                </div>
            </div>
            
            <h2 class="receipt-title">ΑΠΟΔΕΙΞΗ ΣΥΝΔΡΟΜΗΣ</h2>
            
            <div class="info-section">
                <div class="info-row two-cols">
                    <div>
                        <span class="label">Αριθμός Απόδειξης: </span>
                        <span class="value">${data.receiptNumber}</span>
                    </div>
                    <div>
                        <span class="label">Έκδοση: </span>
                        <span class="value">${formatDate(data.issueDate)}</span>
                    </div>
                </div>
                <div class="info-row">
                    <span class="label">Πελάτης:</span>
                    <span class="value">${data.customerName}</span>
                </div>
                ${data.customerVat ? `
                <div class="info-row">
                    <span class="label">ΑΦΜ:</span>
                    <span class="value">${data.customerVat}</span>
                </div>
                ` : ''}
                ${data.startDate || data.endDate ? `
                <div class="info-row two-cols">
                    ${data.startDate ? `
                    <div>
                        <span class="label">Έναρξης: </span>
                        <span class="value">${formatDate(data.startDate)}</span>
                    </div>
                    ` : ''}
                    ${data.endDate ? `
                    <div>
                        <span class="label">Λήξης: </span>
                        <span class="value">${formatDate(data.endDate)}</span>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                ${data.invoiceMark ? `
                <div class="info-row">
                    <span class="label">ΜΑΡΚ:</span>
                    <span class="value">${data.invoiceMark}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="items-section">
                <h3>Στοιχεία Συνδρομής</h3>
                ${data.items && data.items.length > 0 ? data.items.map((item: any) => `
                <div class="item">
                    <div class="item-header">
                        <span class="item-name">${item.description}</span>
                        <span class="item-quantity">Ποσότητα: ${item.quantity}</span>
                    </div>
                    <div class="item-details">
                        <span>Τιμή μονάδας: €${item.unitPrice.toFixed(2)}</span>
                        <span>ΦΠΑ: ${item.vatRate}%</span>
                    </div>
                </div>
                `).join('') : `
                <div class="item">
                    <div class="item-header">
                        <span class="item-name">${data.description || 'Υπηρεσίες Γυμναστηρίου'}</span>
                        <span class="item-quantity">Ποσότητα: 1</span>
                    </div>
                    <div class="item-details">
                        <span>Τιμή μονάδας: €${data.subtotal.toFixed(2)}</span>
                        <span>ΦΠΑ: 13%</span>
                    </div>
                </div>
                `}
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <span class="label">Αξία Συνδρομής:</span>
                    <span class="value">€${data.subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span class="label">ΦΠΑ (13%):</span>
                    <span class="value">€${data.vatAmount.toFixed(2)}</span>
                </div>
                <div class="total-row final">
                    <span class="label">Σύνολο:</span>
                    <span class="value">€${data.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="footer">
                <img src="https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/lovable-uploads/dce6f194-3bc2-4d61-9253-4f976bf25f5f.png" alt="HYPERKIDS Logo" />
            </div>
        </div>
    </body>
    </html>
  `;
};

const generateReceiptHTML = (data: ReceiptData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Απόδειξη Συνδρομής - HYPERKIDS</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #00ffba; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .receipt-title { font-size: 24px; color: #00ffba; margin: 20px 0; }
            .info-section { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; }
            .total-section { background: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #00ffba; }
            .total-amount { font-size: 24px; font-weight: bold; color: #00ffba; text-align: right; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">HYPERKIDS</div>
                <p>ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ</p>
                <p>Διεύθυνση: ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46, ΘΕΣΣΑΛΟΝΙΚΗ 54627</p>
                <p>Email: info@hyperkids.gr | Web: www.hyperkids.gr</p>
                <p>Τηλ: 2310 529104</p>
            </div>
            
            <h2 class="receipt-title">ΑΠΟΔΕΙΞΗ ΣΥΝΔΡΟΜΗΣ</h2>
            
            <div class="info-section">
                <div class="info-row">
                    <span class="label">Αριθμός Απόδειξης:</span>
                    <span class="value">${data.invoiceNumber}</span>
                </div>
                <div class="info-row">
                    <span class="label">Ημερομηνία Έκδοσης:</span>
                    <span class="value">${new Date().toLocaleDateString('el-GR')}</span>
                </div>
                <div class="info-row">
                    <span class="label">Πελάτης:</span>
                    <span class="value">${data.userName}</span>
                </div>
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${data.userEmail}</span>
                </div>
            </div>
            
            <div class="info-section">
                <h3>Στοιχεία Συνδρομής</h3>
                <div class="info-row">
                    <span class="label">Τύπος Συνδρομής:</span>
                    <span class="value">${data.subscriptionType}</span>
                </div>
                <div class="info-row">
                    <span class="label">Ημερομηνία Έναρξης:</span>
                    <span class="value">${new Date(data.startDate).toLocaleDateString('el-GR')}</span>
                </div>
                <div class="info-row">
                    <span class="label">Ημερομηνία Λήξης:</span>
                    <span class="value">${new Date(data.endDate).toLocaleDateString('el-GR')}</span>
                </div>
            </div>
            
            <div class="total-section">
                <div class="info-row">
                    <span class="label">Αξία Συνδρομής:</span>
                    <span class="value">€${data.price.toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span class="label">ΦΠΑ (24%):</span>
                    <span class="value">€${(data.price * 0.24).toFixed(2)}</span>
                </div>
                <div style="margin-top: 10px; border-top: 2px solid #00ffba; padding-top: 10px;">
                    <div class="total-amount">
                        Σύνολο: €${(data.price * 1.24).toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div class="footer" style="text-align: right;">
                <img src="/lovable-uploads/4b47c4bc-34e4-4cd0-8f07-f32a26fabdd8.png" alt="HYPERKIDS Logo" style="width: 80px; height: auto; margin-left: auto; display: block; margin-bottom: 10px;" />
                <p><em>Αυτή η απόδειξη εκδόθηκε ηλεκτρονικά και θα αποσταλεί στο MyData της AADE</em></p>
            </div>
        </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check if this is a receipt notification
    const requestBody = await req.json()
    if (requestBody.type === 'receipt_notification') {
      return await handleReceiptNotification(requestBody)
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const resend = new Resend(resendApiKey)
    const receiptData: ReceiptData = requestBody

    console.log('📧 Αποστολή απόδειξης σε:', receiptData.userEmail)

    const receiptHTML = generateReceiptHTML(receiptData)

    const emailResponse = await resend.emails.send({
      from: 'HYPERKIDS <noreply@hyperkids.gr>',
      to: [receiptData.userEmail],
      subject: `Απόδειξη Συνδρομής #${receiptData.invoiceNumber} - HYPERKIDS`,
      html: receiptHTML,
    })

    console.log('✅ Email στάλθηκε επιτυχώς:', emailResponse.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.id,
        message: 'Η απόδειξη στάλθηκε επιτυχώς' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Σφάλμα αποστολής email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Αποτυχία αποστολής απόδειξης', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})