import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'booking_pending' | 'booking_approved' | 'booking_rejected' | 'reminder_24h' | 'reminder_1h' | 'reminder_15min'
  bookingId: string
  adminEmail?: string
}

interface VideocallBooking {
  id: string
  app_users: {
    full_name: string
    email: string
  }
  videocall_sections: {
    name: string
  }
  date: string
  time: string
  status: string
  meeting_link?: string
  notes?: string
}

const generateEmailHTML = (type: string, booking: VideocallBooking, adminEmail?: string) => {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('el-GR')
  const formatTime = (timeStr: string) => timeStr.slice(0, 5)
  
  const baseStyle = `
    <style>
      body { font-family: 'Robert Pro', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 0; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .header { background: #00ffba; color: black; padding: 30px; text-align: center; }
      .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
      .content { padding: 30px; }
      .booking-info { background: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #00ffba; }
      .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
      .label { font-weight: bold; color: #333; }
      .value { color: #666; }
      .button { background: #00ffba; color: black; padding: 12px 24px; text-decoration: none; border-radius: 0; display: inline-block; margin: 10px 0; font-weight: bold; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
  `

  switch (type) {
    case 'booking_pending':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Νέα Κράτηση Βιντεοκλήσης - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Νέα Κράτηση Βιντεοκλήσης Εκκρεμεί</p>
            </div>
            
            <div class="content">
              <h2>🔔 Νέα Κράτηση Βιντεοκλήσης</h2>
              <p>Μια νέα κράτηση βιντεοκλήσης χρειάζεται την έγκρισή σας:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Αθλητής:</span>
                  <span class="value">${booking.app_users.full_name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${booking.app_users.email}</span>
                </div>
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.videocall_sections.name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.time)}</span>
                </div>
                ${booking.notes ? `
                <div class="info-row">
                  <span class="label">Σημειώσεις:</span>
                  <span class="value">${booking.notes}</span>
                </div>
                ` : ''}
              </div>
              
              <p>Συνδεθείτε στο σύστημα για να εγκρίνετε ή να απορρίψετε την κράτηση.</p>
              
              <a href="https://www.hyperkids.gr/admin/videocalls" class="button">Διαχείριση Κρατήσεων</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'booking_approved':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Βιντεοκλήση Εγκρίθηκε - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Η Βιντεοκλήση σας Εγκρίθηκε! ✅</p>
            </div>
            
            <div class="content">
              <h2>🎉 Η Κράτησή σας Εγκρίθηκε!</h2>
              <p>Η κράτηση βιντεοκλήσης σας έχει εγκριθεί. Ιδού τα στοιχεία:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.videocall_sections.name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.time)}</span>
                </div>
                ${booking.meeting_link ? `
                <div class="info-row">
                  <span class="label">Σύνδεσμος Συνάντησης:</span>
                  <span class="value"><a href="${booking.meeting_link}" style="color: #00ffba;">${booking.meeting_link}</a></span>
                </div>
                ` : ''}
              </div>
              
              <p><strong>Σημαντικό:</strong> Θα λάβετε υπενθυμίσεις 24 ώρες, 1 ώρα και 15 λεπτά πριν τη συνάντηση.</p>
              
              <a href="https://www.hyperkids.gr/online-coaching" class="button">Δείτε τις Κρατήσεις σας</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'booking_rejected':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Βιντεοκλήση Απορρίφθηκε - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Σχετικά με την Κράτηση Βιντεοκλήσης</p>
            </div>
            
            <div class="content">
              <h2>📋 Ενημέρωση Κράτησης</h2>
              <p>Λυπούμαστε, αλλά η κράτηση βιντεοκλήσης σας δεν μπόρεσε να εγκριθεί:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.videocall_sections.name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.time)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Κατάσταση:</span>
                  <span class="value" style="color: #dc3545;">Απορρίφθηκε</span>
                </div>
              </div>
              
              <p>Η βιντεοκλήση έχει επιστραφεί στο πακέτο σας. Μπορείτε να κάνετε νέα κράτηση επιλέγοντας άλλη ημερομηνία και ώρα.</p>
              
              <a href="https://www.hyperkids.gr/online-coaching" class="button">Κάντε Νέα Κράτηση</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
              <p>Για περισσότερες πληροφορίες επικοινωνήστε μαζί μας</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'reminder_24h':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Υπενθύμιση Βιντεοκλήσης - Αύριο - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Υπενθύμιση: Βιντεοκλήση Αύριο! ⏰</p>
            </div>
            
            <div class="content">
              <h2>📅 Υπενθύμιση - 24 Ώρες</h2>
              <p>Σας υπενθυμίζουμε ότι έχετε προγραμματισμένη βιντεοκλήση αύριο:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.videocall_sections.name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.time)}</span>
                </div>
                ${booking.meeting_link ? `
                <div class="info-row">
                  <span class="label">Σύνδεσμος Συνάντησης:</span>
                  <span class="value"><a href="${booking.meeting_link}" style="color: #00ffba;">${booking.meeting_link}</a></span>
                </div>
                ` : ''}
              </div>
              
              <p><strong>Προετοιμασία:</strong></p>
              <ul>
                <li>Ελέγξτε τη σύνδεσή σας στο internet</li>
                <li>Βεβαιωθείτε ότι η κάμερα και το μικρόφωνό σας λειτουργούν</li>
                <li>Βρείτε έναν ήσυχο χώρο για τη συνάντηση</li>
              </ul>
              
              <a href="${booking.meeting_link || 'https://www.hyperkids.gr/online-coaching'}" class="button">Σύνδεσμος Συνάντησης</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'reminder_1h':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Υπενθύμιση Βιντεοκλήσης - 1 Ώρα - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Η Βιντεοκλήση σας Ξεκινάει σε 1 Ώρα! ⏰</p>
            </div>
            
            <div class="content">
              <h2>🔔 Υπενθύμιση - 1 Ώρα</h2>
              <p>Η βιντεοκλήση σας ξεκινάει σε 1 ώρα:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.videocall_sections.name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα Έναρξης:</span>
                  <span class="value">${formatTime(booking.time)}</span>
                </div>
                ${booking.meeting_link ? `
                <div class="info-row">
                  <span class="label">Σύνδεσμος Συνάντησης:</span>
                  <span class="value"><a href="${booking.meeting_link}" style="color: #00ffba;">${booking.meeting_link}</a></span>
                </div>
                ` : ''}
              </div>
              
              <p><strong>Τελικός Έλεγχος:</strong></p>
              <ul>
                <li>✅ Σύνδεση internet</li>
                <li>✅ Κάμερα και μικρόφωνο</li>
                <li>✅ Ήσυχος χώρος</li>
                <li>✅ Σημειώσεις/ερωτήσεις έτοιμες</li>
              </ul>
              
              <a href="${booking.meeting_link || 'https://www.hyperkids.gr/online-coaching'}" class="button">Συμμετοχή στη Συνάντηση</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'reminder_15min':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Υπενθύμιση Βιντεοκλήσης - 15 Λεπτά - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>🚨 Η Βιντεοκλήση σας Ξεκινάει σε 15 Λεπτά!</p>
            </div>
            
            <div class="content">
              <h2>⚡ Τελική Υπενθύμιση - 15 Λεπτά</h2>
              <p><strong>Η βιντεοκλήση σας ξεκινάει πολύ σύντομα!</strong></p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.videocall_sections.name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα Έναρξης:</span>
                  <span class="value">${formatTime(booking.time)}</span>
                </div>
              </div>
              
              <p><strong>Είστε έτοιμοι; Κάντε κλικ παρακάτω για να συνδεθείτε:</strong></p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${booking.meeting_link || 'https://www.hyperkids.gr/online-coaching'}" class="button" style="font-size: 18px; padding: 15px 30px;">🎥 Συνδεθείτε Τώρα</a>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 14px;">
                Προτείνουμε να συνδεθείτε 2-3 λεπτά νωρίτερα για να ελέγξετε τον εξοπλισμό σας.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    default:
      return ''
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const resend = new Resend(resendApiKey)
    const { type, bookingId, adminEmail }: NotificationRequest = await req.json()

    console.log(`📧 Αποστολή ${type} notification για booking ${bookingId}`)

    // Fetch booking details with user and section info
    const { data: booking, error } = await supabase
      .from('videocall_bookings')
      .select(`
        *,
        app_users (full_name, email),
        videocall_sections (name)
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      console.error('❌ Booking not found:', error)
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailHTML = generateEmailHTML(type, booking, adminEmail)
    
    // Determine recipient and subject based on notification type
    let recipient: string
    let subject: string
    
    if (type === 'booking_pending') {
      recipient = adminEmail || 'yorgoszy@gmail.com'
      subject = `🔔 Νέα Κράτηση Βιντεοκλήσης - ${booking.app_users.full_name}`
    } else {
      recipient = booking.app_users.email
      switch (type) {
        case 'booking_approved':
          subject = `✅ Η Βιντεοκλήση σας Εγκρίθηκε - ${booking.videocall_sections.name}`
          break
        case 'booking_rejected':
          subject = `📋 Ενημέρωση για την Κράτηση Βιντεοκλήσης`
          break
        case 'reminder_24h':
          subject = `⏰ Υπενθύμιση: Βιντεοκλήση Αύριο - ${booking.videocall_sections.name}`
          break
        case 'reminder_1h':
          subject = `🔔 Η Βιντεοκλήση σας σε 1 ώρα - ${booking.videocall_sections.name}`
          break
        case 'reminder_15min':
          subject = `🚨 Η Βιντεοκλήση σας σε 15 λεπτά - ${booking.videocall_sections.name}`
          break
        default:
          subject = `HYPERKIDS - Ενημέρωση Βιντεοκλήσης`
      }
    }

    const emailResponse = await resend.emails.send({
      from: 'HYPERKIDS <noreply@hyperkids.gr>',
      to: [recipient],
      subject: subject,
      html: emailHTML,
    })

    console.log(`✅ Email ${type} στάλθηκε επιτυχώς:`, emailResponse.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.id,
        message: `${type} notification sent successfully`,
        recipient: recipient
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Σφάλμα αποστολής videocall notification:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Αποτυχία αποστολής notification', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})