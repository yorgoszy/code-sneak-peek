import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'booking_pending' | 'booking_approved' | 'booking_rejected' | 'reminder_24h' | 'reminder_1h' | 'reminder_15min' | 
        'booking_created' | 'booking_cancelled' | 'offer_accepted' | 'offer_rejected' | 
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
    full_name: string
    email: string
  }
  videocall_date: string
  videocall_time: string
  status: string
  meeting_link?: string
  notes?: string
  videocall_type: string
}

const generateEmailHTML = (type: string, booking?: VideocallBooking, adminEmail?: string, userData?: any) => {
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
                  <span class="value">${booking.videocall_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.videocall_date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.videocall_time)}</span>
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
                  <span class="value">${booking.videocall_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.videocall_date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.videocall_time)}</span>
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
                  <span class="value">${booking.videocall_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.videocall_date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.videocall_time)}</span>
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
                  <span class="value">${booking.videocall_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ημερομηνία:</span>
                  <span class="value">${formatDate(booking.videocall_date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα:</span>
                  <span class="value">${formatTime(booking.videocall_time)}</span>
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
                  <span class="value">${booking.videocall_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα Έναρξης:</span>
                  <span class="value">${formatTime(booking.videocall_time)}</span>
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
                  <span class="value">${booking.videocall_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ώρα Έναρξης:</span>
                  <span class="value">${formatTime(booking.videocall_time)}</span>
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
          <title>Κράτηση Ακυρώθηκε - HYPERKIDS</title>
          ${baseStyle}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HYPERKIDS</div>
              <p>Ακύρωση Κράτησης</p>
            </div>
            
            <div class="content">
              <h2>❌ Κράτηση Ακυρώθηκε</h2>
              <p>Η κράτησή σας έχει ακυρωθεί επιτυχώς:</p>
              
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
                  <span class="label">Κατάσταση:</span>
                  <span class="value" style="color: #dc3545;">Ακυρωμένη</span>
                </div>
              </div>
              
              <p>Η επίσκεψη έχει επιστραφεί στο πακέτο σας. Μπορείτε να κάνετε νέα κράτηση όποτε θέλετε.</p>
              
              <a href="https://www.hyperkids.gr/bookings" class="button">Κάντε Νέα Κράτηση</a>
            </div>
            
            <div class="footer">
              <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
              <p>Email: info@hyperkids.gr | www.hyperkids.gr</p>
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
    const { type, bookingId, adminEmail, userId, paymentId, offerId }: NotificationRequest = await req.json()

    console.log(`📧 Αποστολή ${type} notification`)

    let booking = null
    let userData = null
    let emailHTML = ''

    // Handle videocall notifications
    if (['booking_pending', 'booking_approved', 'booking_rejected', 'reminder_24h', 'reminder_1h', 'reminder_15min'].includes(type)) {
      const { data: bookingData, error } = await supabase
        .from('user_videocalls')
        .select(`
          *,
          app_users (full_name, email)
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
      subject = `🔔 Νέα Κράτηση Βιντεοκλήσης - ${booking.app_users.full_name}`
    } else if (['booking_approved', 'booking_rejected', 'reminder_24h', 'reminder_1h', 'reminder_15min'].includes(type)) {
      recipient = booking.app_users.email
      switch (type) {
        case 'booking_approved':
          subject = `✅ Η Βιντεοκλήση σας Εγκρίθηκε - ${booking.videocall_type}`
          break
        case 'booking_rejected':
          subject = `📋 Ενημέρωση για την Κράτηση Βιντεοκλήσης`
          break
        case 'reminder_24h':
          subject = `⏰ Υπενθύμιση: Βιντεοκλήση Αύριο - ${booking.videocall_type}`
          break
        case 'reminder_1h':
          subject = `🔔 Η Βιντεοκλήση σας σε 1 ώρα - ${booking.videocall_type}`
          break
        case 'reminder_15min':
          subject = `🚨 Η Βιντεοκλήση σας σε 15 λεπτά - ${booking.videocall_type}`
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