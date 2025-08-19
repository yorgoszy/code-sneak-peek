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

    // Δημιουργία HTML για απόδειξη
    const receiptHTML = generateGeneralReceiptHTML({
      receiptNumber: receipt.receipt_number,
      userName: user.name,
      userEmail: user.email,
      customerName: receipt.customer_name,
      total: receipt.total,
      issueDate: receipt.issue_date,
      description: receipt.description || 'Υπηρεσίες',
      vatAmount: receipt.total * 0.24
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
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Απόδειξη - HYPERKIDS</title>
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
                <div class="logo">HYPERKIDS ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ</div>
                <p>ΑΦΜ: 128109909 | ΔΟΥ: Ε' ΘΕΣΣΑΛΟΝΙΚΗΣ</p>
            </div>
            
            <h2 class="receipt-title">ΑΠΟΔΕΙΞΗ</h2>
            
            <div class="info-section">
                <div class="info-row">
                    <span class="label">Αριθμός Απόδειξης:</span>
                    <span class="value">${data.receiptNumber}</span>
                </div>
                <div class="info-row">
                    <span class="label">Ημερομηνία Έκδοσης:</span>
                    <span class="value">${new Date(data.issueDate).toLocaleDateString('el-GR')}</span>
                </div>
                <div class="info-row">
                    <span class="label">Πελάτης:</span>
                    <span class="value">${data.customerName}</span>
                </div>
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${data.userEmail}</span>
                </div>
            </div>
            
            <div class="info-section">
                <h3>Περιγραφή</h3>
                <div class="info-row">
                    <span class="label">Υπηρεσία:</span>
                    <span class="value">${data.description}</span>
                </div>
            </div>
            
            <div class="total-section">
                <div class="info-row">
                    <span class="label">Αξία:</span>
                    <span class="value">€${(data.total / 1.24).toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span class="label">ΦΠΑ (24%):</span>
                    <span class="value">€${data.vatAmount.toFixed(2)}</span>
                </div>
                <div style="margin-top: 10px; border-top: 2px solid #00ffba; padding-top: 10px;">
                    <div class="total-amount">
                        Σύνολο: €${data.total.toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>HYPERKIDS ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ</strong></p>
                <p>ΑΦΜ: 128109909 | ΔΟΥ: Ε' ΘΕΣΣΑΛΟΝΙΚΗΣ</p>
                <p>Τηλ: 2310 529104 | Email: info@hyperkids.gr | Web: www.hyperkids.gr</p>
                <p>Διεύθυνση: ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46, ΘΕΣΣΑΛΟΝΙΚΗ 54627</p>
                <p><em>Αυτή η απόδειξη εκδόθηκε ηλεκτρονικά</em></p>
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
                <div class="logo">HYPERKIDS ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ</div>
                <p>ΑΦΜ: 128109909 | ΔΟΥ: Ε' ΘΕΣΣΑΛΟΝΙΚΗΣ</p>
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
            
            <div class="footer">
                <p><strong>HYPERKIDS ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ</strong></p>
                <p>ΑΦΜ: 128109909 | ΔΟΥ: Ε' ΘΕΣΣΑΛΟΝΙΚΗΣ</p>
                <p>Τηλ: 2310 529104 | Email: info@hyperkids.gr | Web: www.hyperkids.gr</p>
                <p>Διεύθυνση: ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46, ΘΕΣΣΑΛΟΝΙΚΗ 54627</p>
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