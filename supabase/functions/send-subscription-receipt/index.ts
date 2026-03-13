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
    const { receiptId, pdfBase64 } = requestBody

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
      .eq('id', receiptId)
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

    // Αποστολή σε χρήστη + admin
    const recipients = [user.email]
    const adminEmail = 'info@hyperkids.gr'
    if (user.email !== adminEmail) {
      recipients.push(adminEmail)
    }

    // Δημιουργία email με ή χωρίς PDF attachment
    const emailOptions: any = {
      from: 'HYPERKIDS <noreply@hyperkids.gr>',
      to: recipients,
      subject: `Απόδειξη #${receipt.receipt_number} - HYPERKIDS`,
      html: receiptHTML,
    }

    // Αν υπάρχει PDF, το προσθέτουμε ως attachment
    if (pdfBase64) {
      emailOptions.attachments = [{
        filename: `${receipt.receipt_number}.pdf`,
        content: pdfBase64,
      }]
    }

    const emailResponse = await resend.emails.send(emailOptions)

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

  const assetsUrl = "https://hyperkids.lovable.app";

  const itemsHtml = data.items && data.items.length > 0 
    ? data.items.map((item: any) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px;">${item.description}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: center;">${item.vatRate}%</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #000; font-size: 14px; text-align: right; font-weight: 600;">€${(item.unitPrice * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px;">${data.description || 'Υπηρεσίες Γυμναστηρίου'}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: center;">1</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: center;">13%</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #000; font-size: 14px; text-align: right; font-weight: 600;">€${data.subtotal.toFixed(2)}</td>
      </tr>
    `;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #ffffff;">
      <!-- Header -->
      <div style="background: #000; padding: 20px 30px;">
        <img src="${assetsUrl}/images/email-icon-white.png" alt="HYPERKIDS" style="height: 32px; width: auto;" />
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #000; margin: 0 0 5px 0; font-size: 22px;">🧾 Απόδειξη Συνδρομής</h2>
        
        <!-- Receipt Info -->
        <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-left: 4px solid #000;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">Αρ. Απόδειξης:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${data.receiptNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">Ημ. Έκδοσης:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${formatDate(data.issueDate)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">Πελάτης:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${data.customerName}</td>
            </tr>
            ${data.customerVat ? `
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">ΑΦΜ:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${data.customerVat}</td>
            </tr>
            ` : ''}
            ${data.startDate ? `
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">Έναρξη:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${formatDate(data.startDate)}</td>
            </tr>
            ` : ''}
            ${data.endDate ? `
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">Λήξη:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${formatDate(data.endDate)}</td>
            </tr>
            ` : ''}
            ${data.invoiceMark ? `
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">ΜΑΡΚ:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${data.invoiceMark}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Items Table -->
        <p style="color: #000; font-size: 14px; font-weight: 600; margin: 20px 0 10px 0;">Στοιχεία Συνδρομής</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px 0; border-bottom: 2px solid #000; color: #000; font-size: 13px; text-align: left;">Περιγραφή</th>
              <th style="padding: 8px 0; border-bottom: 2px solid #000; color: #000; font-size: 13px; text-align: center;">Ποσ.</th>
              <th style="padding: 8px 0; border-bottom: 2px solid #000; color: #000; font-size: 13px; text-align: center;">ΦΠΑ</th>
              <th style="padding: 8px 0; border-bottom: 2px solid #000; color: #000; font-size: 13px; text-align: right;">Αξία</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-left: 4px solid #000;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #333; font-size: 14px;">Καθαρή Αξία:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">€${data.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #333; font-size: 14px;">ΦΠΑ (13%):</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">€${data.vatAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0 0 0; border-top: 2px solid #000; color: #000; font-size: 20px; font-weight: bold;">Σύνολο:</td>
              <td style="padding: 8px 0 0 0; border-top: 2px solid #000; color: #000; font-size: 20px; font-weight: bold; text-align: right;">€${data.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Business Info -->
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999; font-size: 11px; line-height: 1.5; margin: 0;">
            <strong>HYPERKIDS</strong> - ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ<br/>
            ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46, ΘΕΣΣΑΛΟΝΙΚΗ 54627<br/>
            Τηλ: 2310 529104 | Email: info@hyperkids.gr | Web: www.hyperkids.gr
          </p>
          <p style="color: #aaa; font-size: 10px; margin-top: 8px; font-style: italic;">
            Αυτή η απόδειξη εκδόθηκε ηλεκτρονικά και θα αποσταλεί στο MyData της AADE
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="padding: 15px 30px; border-top: 1px solid #e0e0e0;">
        <img src="${assetsUrl}/images/email-logo.png" alt="HYPERKIDS" style="height: 12px; width: auto; opacity: 0.4;" />
      </div>
    </div>
  `;
};

const generateReceiptHTML = (data: ReceiptData) => {
  const assetsUrl = "https://hyperkids.lovable.app";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #ffffff;">
      <div style="background: #000; padding: 20px 30px;">
        <img src="${assetsUrl}/images/email-icon-white.png" alt="HYPERKIDS" style="height: 32px; width: auto;" />
      </div>
      <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #000; margin: 0 0 5px 0; font-size: 22px;">🧾 Απόδειξη Συνδρομής</h2>
        
        <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-left: 4px solid #000;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">Αρ. Απόδειξης:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${data.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">Ημ. Έκδοσης:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${new Date().toLocaleDateString('el-GR')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">Πελάτης:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${data.userName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #000; font-size: 14px; font-weight: 600;">Email:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">${data.userEmail}</td>
            </tr>
          </table>
        </div>

        <p style="color: #000; font-size: 14px; font-weight: 600; margin: 20px 0 10px 0;">Στοιχεία Συνδρομής</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px 0; border-bottom: 2px solid #000; color: #000; font-size: 13px; text-align: left;">Τύπος</th>
              <th style="padding: 8px 0; border-bottom: 2px solid #000; color: #000; font-size: 13px; text-align: center;">Έναρξη</th>
              <th style="padding: 8px 0; border-bottom: 2px solid #000; color: #000; font-size: 13px; text-align: right;">Λήξη</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px;">${data.subscriptionType}</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: center;">${new Date(data.startDate).toLocaleDateString('el-GR')}</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: right;">${new Date(data.endDate).toLocaleDateString('el-GR')}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-left: 4px solid #000;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #333; font-size: 14px;">Καθαρή Αξία:</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">€${(data.price / 1.13).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #333; font-size: 14px;">ΦΠΑ (13%):</td>
              <td style="padding: 4px 0; color: #333; font-size: 14px; text-align: right;">€${(data.price - data.price / 1.13).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0 0 0; border-top: 2px solid #000; color: #000; font-size: 20px; font-weight: bold;">Σύνολο:</td>
              <td style="padding: 8px 0 0 0; border-top: 2px solid #000; color: #000; font-size: 20px; font-weight: bold; text-align: right;">€${data.price.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999; font-size: 11px; line-height: 1.5; margin: 0;">
            <strong>HYPERKIDS</strong> - ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ<br/>
            ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46, ΘΕΣΣΑΛΟΝΙΚΗ 54627<br/>
            Τηλ: 2310 529104 | Email: info@hyperkids.gr | Web: www.hyperkids.gr
          </p>
          <p style="color: #aaa; font-size: 10px; margin-top: 8px; font-style: italic;">
            Αυτή η απόδειξη εκδόθηκε ηλεκτρονικά και θα αποσταλεί στο MyData της AADE
          </p>
        </div>
      </div>
      <div style="padding: 15px 30px; border-top: 1px solid #e0e0e0;">
        <img src="${assetsUrl}/images/email-logo.png" alt="HYPERKIDS" style="height: 12px; width: auto; opacity: 0.4;" />
      </div>
    </div>
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

    // Test email endpoint
    if (requestBody.type === 'test_email') {
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      if (!resendApiKey) {
        return new Response(JSON.stringify({ error: 'Resend API key not configured' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const resend = new Resend(resendApiKey)
      const testHTML = generateGeneralReceiptHTML({
        receiptNumber: 'TEST-001',
        userName: 'Test User',
        userEmail: requestBody.to,
        customerName: 'Test User',
        customerVat: null,
        total: 5.00,
        subtotal: 4.42,
        vatAmount: 0.58,
        issueDate: new Date().toISOString(),
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        invoiceMark: null,
        description: 'ΔΟΚΙΜΑΣΤΙΚΟ',
        items: []
      })
      const emailResponse = await resend.emails.send({
        from: 'HYPERKIDS <noreply@hyperkids.gr>',
        to: [requestBody.to],
        subject: 'Δοκιμαστική Απόδειξη - HYPERKIDS',
        html: testHTML,
      })
      return new Response(JSON.stringify({ success: true, emailId: emailResponse.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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

    // Αποστολή σε χρήστη + admin
    const recipients = [receiptData.userEmail]
    const adminEmail = 'info@hyperkids.gr'
    if (receiptData.userEmail !== adminEmail) {
      recipients.push(adminEmail)
    }

    const emailResponse = await resend.emails.send({
      from: 'HYPERKIDS <noreply@hyperkids.gr>',
      to: recipients,
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