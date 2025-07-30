import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'booking_pending' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'booking_cancelled_admin' | 
        'reminder_24h' | 'reminder_1h' | 'reminder_15min' | 
        'booking_created' | 'offer_accepted' | 'offer_rejected' | 
        'package_purchased' | 'user_welcome' | 'user_welcome_admin' | 'booking_admin_notification' | 
        'package_purchase_admin' | 'package_receipt' | 'offer_notification' | 'waiting_list_available' |
        'magic_box_result'
  bookingId?: string
  adminEmail?: string
  userId?: string
  paymentId?: string
  offerId?: string
  sectionId?: string
  bookingDate?: string
  bookingTime?: string
  resultType?: string
  prizeWon?: string
  prizeDescription?: string
  discountPercentage?: number
  discountCode?: string
  visitCount?: number
  videocallCount?: number
}

interface VideocallBooking {
  id: string
  app_users: {
    name: string
    email: string
  }
  booking_date: string
  booking_time: string
  status: string
  meeting_link?: string
  notes?: string
  booking_type: string
}

const generateEmailHTML = (type: string, booking?: VideocallBooking, adminEmail?: string, userData?: any) => {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('el-GR')
  const formatTime = (timeStr: string) => timeStr.slice(0, 5)
  
  // Base64 encoded HYPERGYM logo
  const logoBase64 = 'data:image/png;base64,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';

  const baseStyle = `
    <style>
      body { font-family: 'Robert Pro', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 0; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .header { background: #00ffba; color: black; padding: 30px; text-align: center; }
      .logo { margin-bottom: 10px; }
      .logo img { max-height: 60px; height: auto; }
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
              <div class="logo"><img src="${logoBase64}" alt="HYPERGYM" /></div>
              <p>Νέα Κράτηση Βιντεοκλήσης Εκκρεμεί</p>
            </div>
            
            <div class="content">
              <h2>🔔 Νέα Κράτηση Βιντεοκλήσης</h2>
              <p>Μια νέα κράτηση βιντεοκλήσης χρειάζεται την έγκρισή σας:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Χρήστης:</span>
                  <span class="value">${booking.app_users.name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${booking.app_users.email}</span>
                </div>
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.booking_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.booking_date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.booking_time)}</span>
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
              <p><strong>HYPERGYM</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hypergym.gr | www.hypergym.gr</p>
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
              <div class="logo"><img src="${logoBase64}" alt="HYPERGYM" /></div>
              <p>Η Βιντεοκλήση σας Εγκρίθηκε! ✅</p>
            </div>
            
            <div class="content">
              <h2>🎉 Η Κράτησή σας Εγκρίθηκε!</h2>
              <p>Η κράτηση βιντεοκλήσης σας έχει εγκριθεί. Ιδού τα στοιχεία:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.booking_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.booking_date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.booking_time)}</span>
                </div>
                ${booking.meeting_link ? `
                <div class="info-row">
                  <span class="label">Σύνδεσμος Συνάντησης:</span>
                  <span class="value"><a href="${booking.meeting_link}" style="color: #00ffba;">${booking.meeting_link}</a></span>
                </div>
                ` : ''}
              </div>
              
              <p><strong>Σημαντικό:</strong> Θα λάβετε υπενθυμίσεις 24 ώρες, 1 ώρα και 15 λεπτά πριν τη συνάντηση.</p>
              
              <a href="https://www.hyperkids.gr/dashboard/user-profile/${booking.app_users.id}?tab=online-coaching" class="button">Δείτε τις Κρατήσεις σας</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERGYM</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hypergym.gr | www.hypergym.gr</p>
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
              <div class="logo"><img src="${logoBase64}" alt="HYPERGYM" /></div>
              <p>Σχετικά με την Κράτηση Βιντεοκλήσης</p>
            </div>
            
            <div class="content">
              <h2>📋 Ενημέρωση Κράτησης</h2>
              <p>Λυπούμαστε, αλλά η κράτηση βιντεοκλήσης σας δεν μπόρεσε να εγκριθεί:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.booking_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.booking_date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.booking_time)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Κατάσταση:</span>
                  <span class="value" style="color: #dc3545;">Απορρίφθηκε</span>
                </div>
              </div>
              
              <p>Η βιντεοκλήση έχει επιστραφεί στο πακέτο σας. Μπορείτε να κάνετε νέα κράτηση επιλέγοντας άλλη ημερομηνία και ώρα.</p>
              
              <a href="https://www.hyperkids.gr/dashboard/user-profile/${booking.app_users.id}?tab=online-coaching" class="button">Κάντε Νέα Κράτηση</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERGYM</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hypergym.gr | www.hypergym.gr</p>
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
              <div class="logo"><img src="${logoBase64}" alt="HYPERGYM" /></div>
              <p>Υπενθύμιση: Βιντεοκλήση Αύριο! ⏰</p>
            </div>
            
            <div class="content">
              <h2>📅 Υπενθύμιση - 24 Ώρες</h2>
              <p>Σας υπενθυμίζουμε ότι έχετε προγραμματισμένη βιντεοκλήση αύριο:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.booking_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.booking_date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.booking_time)}</span>
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
              
              <a href="${booking.meeting_link || `https://www.hyperkids.gr/dashboard/user-profile/${booking.app_users.id}?tab=online-coaching`}" class="button">Σύνδεσμος Συνάντησης</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERGYM</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hypergym.gr | www.hypergym.gr</p>
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
              <div class="logo"><img src="${logoBase64}" alt="HYPERGYM" /></div>
              <p>Η Βιντεοκλήση σας Ξεκινάει σε 1 Ώρα! ⏰</p>
            </div>
            
            <div class="content">
              <h2>🔔 Υπενθύμιση - 1 Ώρα</h2>
              <p>Η βιντεοκλήση σας ξεκινάει σε 1 ώρα:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.booking_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα Έναρξης:</span>
                  <span class="value">${formatTime(booking.booking_time)}</span>
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
              
              <a href="${booking.meeting_link || `https://www.hyperkids.gr/dashboard/user-profile/${booking.app_users.id}?tab=online-coaching`}" class="button">Συμμετοχή στη Συνάντηση</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERGYM</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hypergym.gr | www.hypergym.gr</p>
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
              <div class="logo"><img src="https://dicwdviufetibnafzipa.lovable.app/hypergym-logo.png" alt="HYPERGYM" /></div>
              <p>🚨 Η Βιντεοκλήση σας Ξεκινάει σε 15 Λεπτά!</p>
            </div>
            
            <div class="content">
              <h2>⚡ Τελική Υπενθύμιση - 15 Λεπτά</h2>
              <p><strong>Η βιντεοκλήση σας ξεκινάει πολύ σύντομα!</strong></p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking.booking_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα Έναρξης:</span>
                  <span class="value">${formatTime(booking.booking_time)}</span>
                </div>
              </div>
              
              <p><strong>Είστε έτοιμοι; Κάντε κλικ παρακάτω για να συνδεθείτε:</strong></p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${booking.meeting_link || `https://www.hyperkids.gr/dashboard/user-profile/${booking.app_users.id}?tab=online-coaching`}" class="button" style="font-size: 18px; padding: 15px 30px;">🎥 Συνδεθείτε Τώρα</a>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 14px;">
                Προτείνουμε να συνδεθείτε 2-3 λεπτά νωρίτερα για να ελέγξετε τον εξοπλισμό σας.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>HYPERGYM</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hypergym.gr | www.hypergym.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'user_welcome':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Καλώς ήρθατε στο HYPERKIDS!</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Καλώς ήρθατε στην οικογένεια μας! 🎉</p>
            </div>
            
            <div class="content">
              <h2>🎯 Καλώς ήρθατε ${userData?.full_name || 'στο HYPERKIDS'}!</h2>
              <p>Είμαστε χαρούμενοι που εγγραφήκατε στο προπονητικό κέντρο HYPERKIDS!</p>
              
              <div class="booking-info">
                <h3>Τι μπορείτε να κάνετε:</h3>
                <ul>
                  <li>🏃‍♂️ Κλείστε το ραντεβού σας για το γυμναστήριο</li>
                  <li>💻 Προγραμματίστε online coaching sessions</li>
                  <li>📊 Παρακολουθήστε την πρόοδό σας</li>
                  <li>🎯 Δείτε τα προγράμματα προπόνησης</li>
                </ul>
              </div>
              
              <p>Για να ξεκινήσετε, συνδεθείτε στο λογαριασμό σας και εξερευνήστε τις υπηρεσίες μας!</p>
              
              <a href="https://www.hyperkids.gr" class="button">Εξερευνήστε το HYPERKIDS</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'booking_created':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Κράτηση Επιβεβαιώθηκε - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Η Κράτησή σας Επιβεβαιώθηκε! ✅</p>
            </div>
            
            <div class="content">
              <h2>📅 Κράτηση Επιβεβαιώθηκε</h2>
              <p>Η κράτηση για το γυμναστήριο σας έχει επιβεβαιωθεί:</p>
              
               <div class="booking-info">
                 <div class="info-row">
                   <span class="label">Τμήμα:</span>
                   <span class="value">${userData?.section_name || 'Γυμναστήριο'}</span>
                 </div>
                 <div class="info-row">
                   <span class="label">Ημερομηνία:</span>
                   <span class="value">${userData?.booking_date ? formatDate(userData.booking_date) : new Date().toLocaleDateString('el-GR')}</span>
                 </div>
                 <div class="info-row">
                   <span class="label">Ώρα:</span>
                   <span class="value">${userData?.booking_time ? formatTime(userData.booking_time) : new Date().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
                 <div class="info-row">
                   <span class="label">Τύπος:</span>
                   <span class="value">Επίσκεψη Γυμναστηρίου</span>
                 </div>
               </div>
              
              <p>Θα λάβετε υπενθύμιση 24 ώρες πριν την επίσκεψή σας.</p>
              
              <a href="https://www.hyperkids.gr/dashboard/user-profile/${booking.app_users.id}?tab=online-booking" class="button">Δείτε τις Κρατήσεις σας</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'booking_cancelled':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Βιντεοκλήση Ακυρώθηκε - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo"><img src="https://dicwdviufetibnafzipa.lovable.app/hypergym-logo.png" alt="HYPERGYM" /></div>
              <p>Ακύρωση Βιντεοκλήσης</p>
            </div>
            
            <div class="content">
              <h2>❌ Βιντεοκλήση Ακυρώθηκε</h2>
              <p>Η κράτηση βιντεοκλήσης σας έχει ακυρωθεί επιτυχώς:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking?.booking_type || 'βιντεοκλήση'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${booking ? formatDate(booking.booking_date) : formatDate(userData?.booking_date || new Date().toISOString())}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${booking ? formatTime(booking.booking_time) : formatTime(userData?.booking_time || '00:00')}</span>
                </div>
                <div class="info-row">
                  <span class="label">Κατάσταση:</span>
                  <span class="value" style="color: #dc3545;">Ακυρωμένη</span>
                </div>
              </div>
              
              <p>Η βιντεοκλήση έχει επιστραφεί στο πακέτο σας. Μπορείτε να κάνετε νέα κράτηση επιλέγοντας άλλη ημερομηνία και ώρα.</p>
              
              <a href="https://www.hyperkids.gr/dashboard/user-profile/${booking.app_users.id}?tab=online-coaching" class="button">Κάντε Νέα Κράτηση</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERGYM</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hypergym.gr | www.hypergym.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'booking_cancelled_admin':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Βιντεοκλήση Ακυρώθηκε - Admin Notification - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo"><img src="https://dicwdviufetibnafzipa.lovable.app/hypergym-logo.png" alt="HYPERGYM" /></div>
              <p>Ακύρωση Βιντεοκλήσης</p>
            </div>
            
            <div class="content">
              <h2>🔔 Βιντεοκλήση Ακυρώθηκε</h2>
              <p>Ενημέρωση: Μια βιντεοκλήση ακυρώθηκε από τον χρήστη:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Χρήστης:</span>
                  <span class="value">${booking?.app_users?.name || 'Άγνωστος'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${booking?.app_users?.email || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Τύπος Συνεδρίας:</span>
                  <span class="value">${booking?.booking_type || 'βιντεοκλήση'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${booking ? formatDate(booking.booking_date) : 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${booking ? formatTime(booking.booking_time) : 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Κατάσταση:</span>
                  <span class="value" style="color: #dc3545;">Ακυρωμένη</span>
                </div>
              </div>
              
              <p>Η βιντεοκλήση έχει επιστραφεί στο πακέτο του χρήστη.</p>
              
              <a href="https://www.hyperkids.gr/dashboard/online-coaching" class="button">Διαχείριση Κρατήσεων</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERGYM</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hypergym.gr | www.hypergym.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'package_purchased':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Αγορά Πακέτου - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Αγορά Πακέτου Επιβεβαιώθηκε! 🎉</p>
            </div>
            
            <div class="content">
              <h2>✅ Πακέτο Αγοράστηκε Επιτυχώς</h2>
              <p>Ευχαριστούμε για την αγορά σας! Το πακέτο σας είναι έτοιμο προς χρήση:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Πακέτο:</span>
                  <span class="value">${userData?.package_name || 'Πακέτο Υπηρεσιών'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ποσό:</span>
                  <span class="value">${userData?.amount || '0'}€</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία Αγοράς:</span>
                  <span class="value">${userData?.purchase_date ? formatDate(userData.purchase_date) : formatDate(new Date().toISOString())}</span>
                </div>
              </div>
              
              <p>Μπορείτε πλέον να κλείσετε ραντεβού και να χρησιμοποιήσετε τις υπηρεσίες του πακέτου σας!</p>
              
              <a href="https://www.hyperkids.gr/dashboard/user-profile/${booking.app_users.id}?tab=online-booking" class="button">Κλείστε Ραντεβού</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'offer_accepted':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Προσφορά Αποδεκτή - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Προσφορά Αποδεκτή! 🎉</p>
            </div>
            
            <div class="content">
              <h2>✅ Η Προσφορά σας Αποδέχθηκε</h2>
              <p>Ευχαριστούμε που αποδεχθήκατε την ειδική προσφορά μας:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Προσφορά:</span>
                  <span class="value">${userData?.offer_name || 'Ειδική Προσφορά'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Έκπτωση:</span>
                  <span class="value">${userData?.discount || '0'}%</span>
                </div>
                <div class="info-row">
                  <span class="label">Νέα Τιμή:</span>
                  <span class="value">${userData?.discounted_price || '0'}€</span>
                </div>
              </div>
              
              <p>Η προσφορά έχει εφαρμοστεί στο λογαριασμό σας και μπορείτε να προχωρήσετε στην αγορά!</p>
              
              <a href="https://www.hyperkids.gr/shop" class="button">Ολοκληρώστε την Αγορά</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'offer_rejected':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Προσφορά Απορρίφθηκε - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Σχετικά με την Προσφορά</p>
            </div>
            
            <div class="content">
              <h2>📋 Προσφορά Απορρίφθηκε</h2>
              <p>Λάβαμε την απάντησή σας σχετικά με την προσφορά μας.</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Προσφορά:</span>
                  <span class="value">${userData?.offer_name || 'Ειδική Προσφορά'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Κατάσταση:</span>
                  <span class="value" style="color: #dc3545;">Απορρίφθηκε</span>
                </div>
              </div>
              
              <p>Δεν υπάρχει πρόβλημα! Θα συνεχίσουμε να σας ενημερώνουμε για μελλοντικές προσφορές που μπορεί να σας ενδιαφέρουν.</p>
              
              <a href="https://www.hyperkids.gr/shop" class="button">Δείτε τις Υπηρεσίες μας</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `

    // Admin notifications για νέους χρήστες
    case 'user_welcome_admin':
      return `
        <h1>Νέα Εγγραφή Χρήστη - HYPERKIDS</h1>
        <p>Γεια σας,</p>
        <p>Ένας νέος χρήστης εγγράφηκε στην πλατφόρμα:</p>
        <ul>
          <li><strong>Όνομα:</strong> ${userData?.name || userData?.full_name || 'N/A'}</li>
          <li><strong>Email:</strong> ${userData?.email || 'N/A'}</li>
          <li><strong>Ημερομηνία εγγραφής:</strong> ${new Date().toLocaleDateString('el-GR')}</li>
        </ul>
        <p>Με εκτίμηση,<br/>Το σύστημα HYPERKIDS</p>
      `;

    // Admin notification για booking
    case 'booking_admin_notification':
      return `
        <h1>Νέα Κράτηση Επίσκεψης - HYPERKIDS</h1>
        <p>Γεια σας,</p>
        <p>Ο χρήστης <strong>${userData?.name || userData?.full_name || 'Άγνωστος'}</strong> έκανε κράτηση επίσκεψης:</p>
        <ul>
          <li><strong>Ημερομηνία:</strong> ${userData?.booking_date ? new Date(userData.booking_date).toLocaleDateString('el-GR') : 'N/A'}</li>
          <li><strong>Ώρα:</strong> ${userData?.booking_time || 'N/A'}</li>
          <li><strong>Email:</strong> ${userData?.email || 'N/A'}</li>
        </ul>
        <p>Με εκτίμηση,<br/>Το σύστημα HYPERKIDS</p>
      `;

    // Admin notification για αγορά πακέτου
    case 'package_purchase_admin':
      return `
        <h1>Αγορά Πακέτου - HYPERKIDS</h1>
        <p>Γεια σας,</p>
        <p>Ο χρήστης <strong>${userData?.name || userData?.full_name || 'Άγνωστος'}</strong> αγόρασε ένα πακέτο:</p>
        <ul>
          <li><strong>Email:</strong> ${userData?.email || 'N/A'}</li>
          <li><strong>Ημερομηνία αγοράς:</strong> ${new Date().toLocaleDateString('el-GR')}</li>
          <li><strong>Ποσό:</strong> ${userData?.amount || 'N/A'}€</li>
          <li><strong>Τρόπος πληρωμής:</strong> ${userData?.payment_method || 'N/A'}</li>
        </ul>
        <p>Με εκτίμηση,<br/>Το σύστημα HYPERKIDS</p>
      `;

    // User notification για απόδειξη πακέτου
    case 'package_receipt':
      return `
        <h1>Απόδειξη Αγοράς - HYPERKIDS</h1>
        <p>Αγαπητέ/ή ${userData?.name || userData?.full_name || 'Φίλε/η'},</p>
        <p>Σας ευχαριστούμε για την αγορά σας! Παρακάτω θα βρείτε τα στοιχεία της απόδειξής σας:</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3>Στοιχεία Απόδειξης</h3>
          <p><strong>Ημερομηνία:</strong> ${new Date().toLocaleDateString('el-GR')}</p>
          <p><strong>Ποσό:</strong> ${userData?.amount || 'N/A'}€</p>
          <p><strong>Τρόπος πληρωμής:</strong> ${userData?.payment_method || 'N/A'}</p>
          <p><strong>Αρ. συναλλαγής:</strong> ${userData?.transaction_id || 'N/A'}</p>
        </div>
        <p>Για οποιαδήποτε απορία, μη διστάσετε να επικοινωνήσετε μαζί μας.</p>
        <p>Με εκτίμηση,<br/>Η ομάδα του HYPERKIDS</p>
      `;

    // User notification για νέα προσφορά
    case 'offer_notification':
      return `
        <h1>Νέα Προσφορά για Εσάς! - HYPERKIDS</h1>
        <p>Αγαπητέ/ά ${userData?.name || userData?.full_name || 'Φίλε/η'},</p>
        <p>Έχουμε μια ειδική προσφορά για εσάς!</p>
        <div style="background-color: #00ffba; padding: 20px; margin: 20px 0; border-radius: 5px; color: black;">
          <h3>🎉 Ειδική Προσφορά!</h3>
          <p><strong>Περιγραφή:</strong> ${userData?.description || 'Ειδική προσφορά διαθέσιμη'}</p>
          <p><strong>Τιμή:</strong> ${userData?.discounted_price || 'N/A'}€</p>
          <p><strong>Ισχύει έως:</strong> ${userData?.end_date ? new Date(userData.end_date).toLocaleDateString('el-GR') : 'N/A'}</p>
        </div>
        <p>Συνδεθείτε στην πλατφόρμα μας για να δείτε όλες τις λεπτομέρειες και να αξιοποιήσετε αυτή την προσφορά!</p>
        <p>Με εκτίμηση,<br/>Η ομάδα του HYPERKIDS</p>
      `;

    // Waiting list availability notification
    case 'waiting_list_available':
      const isVideocall = userData?.bookingType === 'videocall';
      const activityType = isVideocall ? 'Videocall' : 'Γυμναστήριο';
      const emoji = isVideocall ? '📹' : '🏃‍♂️';
      const linkPath = isVideocall ? 'online-coaching' : 'online-booking';
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Διαθέσιμη Θέση ${isVideocall ? 'για Videocall' : 'στο Γυμναστήριο'}! - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Καλά Νέα! Διαθέσιμη Θέση ${isVideocall ? 'για Videocall' : 'στο Γυμναστήριο'}! 🎉</p>
            </div>
            
            <div class="content">
              <h2>🚨 Επείγον: Διαθέσιμη Θέση!</h2>
              <p>Μόλις ελευθερώθηκε μια θέση για ${isVideocall ? 'videocall' : 'την επίσκεψη στο γυμναστήριο'} που είχατε επιλέξει στη λίστα αναμονής:</p>
              
              <div class="booking-info">
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${userData?.bookingDate ? formatDate(userData.bookingDate) : 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${userData?.bookingTime ? formatTime(userData.bookingTime) : 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Τύπος:</span>
                  <span class="value">${activityType}</span>
                </div>
              </div>
              
              <p><strong>⏰ Προσοχή:</strong> Έχετε περιορισμένο χρόνο για να κλείσετε αυτή τη θέση. Αν δεν κάνετε κράτηση σύντομα, η θέση θα δοθεί στον επόμενο στη λίστα αναμονής.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.hyperkids.gr/dashboard/user-profile/${userData?.userId}?tab=${linkPath}" class="button" style="font-size: 18px; padding: 15px 30px;">${emoji} Κλείστε τη Θέση Τώρα!</a>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 14px;">
                Το email αυτό στάλθηκε επειδή βρισκόσασταν στη λίστα αναμονής για αυτή την ώρα.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'magic_box_result':
      const isWin = userData?.resultType !== 'try_again';
      const prizeEmoji = isWin ? '🎉' : '🎯';
      const titleColor = isWin ? '#00ffba' : '#ff6b6b';
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${isWin ? 'Συγχαρητήρια! Κερδίσατε' : 'Μαγικό Κουτί - Δοκίμασε Ξανά'} - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo"><img src="${logoBase64}" alt="HYPERGYM" /></div>
              <p>${isWin ? 'Συγχαρητήρια! Κερδίσατε!' : 'Δοκίμασε Ξανά!'} ${prizeEmoji}</p>
            </div>
            
            <div class="content">
              <h2 style="color: ${titleColor};">${prizeEmoji} ${isWin ? 'Μεγάλα Συγχαρητήρια!' : 'Μη Στεναχωριέστε!'}</h2>
              
              ${isWin ? `
                <p>Το μαγικό κουτί σας χάρισε ένα υπέροχο δώρο!</p>
                
                <div class="booking-info" style="background: linear-gradient(135deg, #00ffba, #00e6a8); color: black;">
                  <div class="info-row">
                    <span class="label">🎁 Βραβείο:</span>
                    <span class="value" style="font-weight: bold; font-size: 18px;">${userData?.prizeWon || 'Μυστήριο Δώρο'}</span>
                  </div>
                  ${userData?.prizeDescription ? `
                  <div class="info-row">
                    <span class="label">📝 Περιγραφή:</span>
                    <span class="value">${userData.prizeDescription}</span>
                  </div>
                  ` : ''}
                  ${userData?.discountCode ? `
                  <div class="info-row">
                    <span class="label">🏷️ Κωδικός Έκπτωσης:</span>
                    <span class="value" style="background: white; padding: 5px 10px; border-radius: 5px; font-weight: bold; letter-spacing: 2px;">${userData.discountCode}</span>
                  </div>
                  ` : ''}
                  ${userData?.discountPercentage ? `
                  <div class="info-row">
                    <span class="label">💰 Έκπτωση:</span>
                    <span class="value">${userData.discountPercentage}%</span>
                  </div>
                  ` : ''}
                  ${userData?.visitCount ? `
                  <div class="info-row">
                    <span class="label">🏃‍♂️ Επισκέψεις Γυμναστηρίου:</span>
                    <span class="value">${userData.visitCount} ${userData.visitCount === 1 ? 'επίσκεψη' : 'επισκέψεις'}</span>
                  </div>
                  ` : ''}
                  ${userData?.videocallCount ? `
                  <div class="info-row">
                    <span class="label">📹 Βιντεοκλήσεις:</span>
                    <span class="value">${userData.videocallCount} ${userData.videocallCount === 1 ? 'βιντεοκλήση' : 'βιντεοκλήσεις'}</span>
                  </div>
                  ` : ''}
                </div>
                
                <p>Το δώρο σας έχει ήδη προστεθεί στον λογαριασμό σας και μπορείτε να το χρησιμοποιήσετε άμεσα!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://www.hyperkids.gr/dashboard/user-profile" class="button" style="font-size: 18px; padding: 15px 30px;">🎉 Δείτε τον Λογαριασμό σας</a>
                </div>
              ` : `
                <p>Δυστυχώς αυτή τη φορά δεν κερδίσατε κάποιο από τα κύρια δώρα, αλλά μη στεναχωριέστε!</p>
                
                <div class="booking-info" style="background: linear-gradient(135deg, #ff9999, #ff8080); color: white;">
                  <div class="info-row">
                    <span class="label">🎁 Δώρο Παρηγοριάς:</span>
                    <span class="value" style="font-weight: bold;">1 Δωρεάν Επίσκεψη Γυμναστηρίου!</span>
                  </div>
                  <div class="info-row">
                    <span class="label">💪 Περιλαμβάνει Πρόσβαση:</span>
                    <span class="value">Κύριο Γυμναστήριο & Body Transformation</span>
                  </div>
                </div>
                
                <p>Η δωρεάν επίσκεψη έχει ήδη προστεθεί στον λογαριασμό σας! Επίσης, κρατήστε τα μάτια σας ανοικτά για νέα μαγικά κουτιά στο μέλλον! 🍀</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://www.hyperkids.gr/dashboard/user-profile/${userData?.userId}?tab=online-booking" class="button" style="background: #ff6b6b; font-size: 18px; padding: 15px 30px;">🏃‍♂️ Κλείστε την Επίσκεψή σας</a>
                </div>
              `}
              
              <p style="text-align: center; color: #666; font-size: 14px;">
                Σας ευχαριστούμε που συμμετείχατε στο παιχνίδι μας!
              </p>
            </div>
            
            <div class="footer">
              <p><strong>HYPERGYM</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hypergym.gr | www.hypergym.gr</p>
            </div>
          </div>
        </body>
        </html>
      `;

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
    const { type, bookingId, adminEmail, userId, paymentId, offerId, bookingDate, bookingTime }: NotificationRequest = await req.json()

    console.log(`📧 Αποστολή ${type} notification`)

    let booking = null
    let userData = null
    let emailHTML = ''

    // Handle videocall notifications
    if (['booking_pending', 'booking_approved', 'booking_rejected', 'booking_cancelled', 'booking_cancelled_admin', 'reminder_24h', 'reminder_1h', 'reminder_15min'].includes(type)) {
      const { data: bookingData, error } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          app_users!user_id (name, email)
        `)
        .eq('id', bookingId)
        .single()

      if (error || !bookingData) {
        console.error('❌ Booking not found:', error)
        return new Response(
          JSON.stringify({ error: 'Booking not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      booking = bookingData
      emailHTML = generateEmailHTML(type, booking, adminEmail)
    }

    // Handle other notification types
    if (['user_welcome', 'booking_created', 'booking_cancelled', 'package_purchased', 'offer_accepted', 'offer_rejected', 
          'user_welcome_admin', 'booking_admin_notification', 'package_purchase_admin', 'package_receipt', 'offer_notification', 'waiting_list_available', 'magic_box_result'].includes(type)) {
      // Fetch user data
      if (userId) {
        const { data: user } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', userId)
          .single()
        userData = user
      }

      // Fetch booking data for booking_created and booking_cancelled
      if (['booking_created', 'booking_cancelled'].includes(type) && bookingId) {
        if (type === 'booking_cancelled' && bookingDate && bookingTime) {
          // For cancellations, use the data passed directly since booking might be deleted
          userData = { 
            ...userData, 
            booking_date: bookingDate,
            booking_time: bookingTime,
            booking_type: 'gym_visit' // Assume gym visit for now
          }
        } else {
          // For other types, fetch from database
          const { data: bookingData } = await supabase
            .from('booking_sessions')
            .select(`
              *,
              section:booking_sections(name, description)
            `)
            .eq('id', bookingId)
            .single()
          
          if (bookingData) {
            userData = { 
              ...userData, 
              booking_date: bookingData.booking_date,
              booking_time: bookingData.booking_time,
              booking_type: bookingData.booking_type,
              section_name: bookingData.section?.name
            }
          }
        }
      }

      // Fetch additional data based on type
      if (type === 'package_purchased' && paymentId) {
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single()
        userData = { ...userData, ...payment }
      }

      if (['offer_accepted', 'offer_rejected'].includes(type) && offerId) {
        const { data: offer } = await supabase
          .from('offers')
          .select('*')
          .eq('id', offerId)
          .single()
        userData = { ...userData, ...offer }
      }

      // Add booking data for waiting list notification
      if (type === 'waiting_list_available') {
        const { sectionId, bookingDate, bookingTime, bookingType } = await req.json()
        userData = { 
          ...userData, 
          bookingDate, 
          bookingTime,
          sectionId,
          bookingType
        }
      }

      emailHTML = generateEmailHTML(type, null, adminEmail, userData)
    }
    
    // Determine recipient and subject based on notification type
    let recipient: string
    let subject: string
    
    if (type === 'booking_pending') {
      recipient = adminEmail || 'yorgoszy@gmail.com'
      subject = `🔔 Νέα Κράτηση Βιντεοκλήσης - ${booking.app_users.name}`
    } else if (type === 'booking_cancelled_admin') {
      recipient = adminEmail || 'yorgoszy@gmail.com'
      subject = `❌ Βιντεοκλήση Ακυρώθηκε - ${booking.app_users.name}`
    } else if (['booking_approved', 'booking_rejected', 'booking_cancelled', 'reminder_24h', 'reminder_1h', 'reminder_15min'].includes(type)) {
      recipient = booking.app_users.email
      switch (type) {
        case 'booking_approved':
          subject = `✅ Η Βιντεοκλήση σας Εγκρίθηκε - ${booking.booking_type}`
          break
        case 'booking_rejected':
          subject = `📋 Ενημέρωση για την Κράτηση Βιντεοκλήσης`
          break
        case 'booking_cancelled':
          subject = `❌ Βιντεοκλήση Ακυρώθηκε - ${booking.booking_type}`
          break
        case 'reminder_24h':
          subject = `⏰ Υπενθύμιση: Βιντεοκλήση Αύριο - ${booking.booking_type}`
          break
        case 'reminder_1h':
          subject = `🔔 Η Βιντεοκλήση σας σε 1 ώρα - ${booking.booking_type}`
          break
        case 'reminder_15min':
          subject = `🚨 Η Βιντεοκλήση σας σε 15 λεπτά - ${booking.booking_type}`
          break
        default:
          subject = `HYPERKIDS - Ενημέρωση Βιντεοκλήσης`
      }
    } else {
      // Handle other notification types
      if (['user_welcome_admin', 'booking_admin_notification', 'package_purchase_admin'].includes(type)) {
        recipient = 'yorgoszy@gmail.com'
      } else {
        recipient = userData?.email || 'info@hyperkids.gr'
      }
      
      switch (type) {
        case 'user_welcome':
          subject = `🎉 Καλώς ήρθατε στο HYPERKIDS!`
          break
        case 'user_welcome_admin':
          subject = `👤 Νέα Εγγραφή Χρήστη - HYPERKIDS`
          break
        case 'booking_created':
          subject = `✅ Κράτηση Επιβεβαιώθηκε - HYPERKIDS`
          break
        case 'booking_admin_notification':
          subject = `📅 Νέα Κράτηση Επίσκεψης - HYPERKIDS`
          break
        case 'booking_cancelled':
          subject = `❌ Κράτηση Ακυρώθηκε - HYPERKIDS`
          break
        case 'package_purchased':
          subject = `🎉 Αγορά Πακέτου Επιβεβαιώθηκε - HYPERKIDS`
          break
        case 'package_purchase_admin':
          subject = `💰 Νέα Αγορά Πακέτου - HYPERKIDS`
          break
        case 'package_receipt':
          subject = `🧾 Απόδειξη Αγοράς - HYPERKIDS`
          break
        case 'offer_accepted':
          subject = `✅ Προσφορά Αποδεκτή - HYPERKIDS`
          break
        case 'offer_rejected':
          subject = `📋 Σχετικά με την Προσφορά - HYPERKIDS`
          break
        case 'offer_notification':
          subject = `🎁 Νέα Προσφορά για Εσάς - HYPERKIDS`
          break
        case 'waiting_list_available':
          const waitingListType = userData?.bookingType === 'videocall' ? 'Videocall' : 'Γυμναστήριο';
          subject = `🚨 Διαθέσιμη Θέση για ${waitingListType}! - HYPERKIDS`
          break
        case 'magic_box_result':
          const magicBoxSubject = req.resultType === 'try_again' ? 
            '🎯 Μαγικό Κουτί - Δοκίμασε Ξανά!' : 
            '🎉 Μαγικό Κουτί - Συγχαρητήρια!';
          subject = magicBoxSubject
          break
        default:
          subject = `HYPERKIDS - Ενημέρωση`
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