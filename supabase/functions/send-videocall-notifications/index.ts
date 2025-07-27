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
        'package_purchase_admin' | 'package_receipt' | 'offer_notification' | 'waiting_list_available'
  bookingId?: string
  adminEmail?: string
  userId?: string
  paymentId?: string
  offerId?: string
  sectionId?: string
  bookingDate?: string
  bookingTime?: string
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
  
  // Base64 encoded logo - HYPERGYM logo
  const logoBase64 = "data:image/png;base64,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"
  
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
              
              <a href="https://www.hyperkids.gr/online-coaching" class="button">Δείτε τις Κρατήσεις σας</a>
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
              
              <a href="https://www.hyperkids.gr/online-coaching" class="button">Κάντε Νέα Κράτηση</a>
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
              
              <a href="${booking.meeting_link || 'https://www.hyperkids.gr/online-coaching'}" class="button">Σύνδεσμος Συνάντησης</a>
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
              
              <a href="${booking.meeting_link || 'https://www.hyperkids.gr/online-coaching'}" class="button">Συμμετοχή στη Συνάντηση</a>
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
              <div class="logo"><img src="${logoBase64}" alt="HYPERGYM" /></div>
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
                <a href="${booking.meeting_link || 'https://www.hyperkids.gr/online-coaching'}" class="button" style="font-size: 18px; padding: 15px 30px;">🎥 Συνδεθείτε Τώρα</a>
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
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${userData?.booking_date ? formatDate(userData.booking_date) : 'TBD'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${userData?.booking_time ? formatTime(userData.booking_time) : 'TBD'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Τύπος:</span>
                  <span class="value">Επίσκεψη Γυμναστηρίου</span>
                </div>
              </div>
              
              <p>Θα λάβετε υπενθύμιση 24 ώρες πριν την επίσκεψή σας.</p>
              
              <a href="https://www.hyperkids.gr/bookings" class="button">Δείτε τις Κρατήσεις σας</a>
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
              <div class="logo"><img src="${logoBase64}" alt="HYPERGYM" /></div>
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
              
              <a href="https://www.hyperkids.gr/dashboard/user-profile/online-coaching" class="button">Κάντε Νέα Κράτηση</a>
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
              <div class="logo"><img src="${logoBase64}" alt="HYPERGYM" /></div>
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
              
              <a href="https://www.hyperkids.gr/bookings" class="button">Κλείστε Ραντεβού</a>
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
                <a href="https://www.hyperkids.gr/dashboard/user-profile/${linkPath}" class="button" style="font-size: 18px; padding: 15px 30px;">${emoji} Κλείστε τη Θέση Τώρα!</a>
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
          'user_welcome_admin', 'booking_admin_notification', 'package_purchase_admin', 'package_receipt', 'offer_notification', 'waiting_list_available'].includes(type)) {
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