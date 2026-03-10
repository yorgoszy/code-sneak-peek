import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="rounded-none gap-2">
              <ArrowLeft className="w-4 h-4" />
              Αρχική
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Πολιτική Απορρήτου</h1>
        <p className="text-muted-foreground mb-8">Τελευταία ενημέρωση: 10 Μαρτίου 2026</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Εισαγωγή</h2>
            <p>
              Η πλατφόρμα HyperKids (εφεξής «εμείς», «μας» ή «η Πλατφόρμα») δεσμεύεται στην προστασία
              των προσωπικών σας δεδομένων. Η παρούσα Πολιτική Απορρήτου εξηγεί ποια δεδομένα
              συλλέγουμε, πώς τα χρησιμοποιούμε και ποια είναι τα δικαιώματά σας σύμφωνα με τον
              Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Δεδομένα που Συλλέγουμε</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Στοιχεία εγγραφής: Ονοματεπώνυμο, email, τηλέφωνο</li>
              <li>Δεδομένα προφίλ: Ημερομηνία γέννησης, φύλο, φωτογραφία</li>
              <li>Δεδομένα προπόνησης: Προγράμματα, μετρήσεις απόδοσης, αποτελέσματα τεστ</li>
              <li>Δεδομένα κρατήσεων: Ημερομηνίες και ώρες κρατήσεων γυμναστηρίου</li>
              <li>Δεδομένα πληρωμών: Ιστορικό συνδρομών (δεν αποθηκεύουμε στοιχεία καρτών)</li>
              <li>Τεχνικά δεδομένα: Διεύθυνση IP, τύπος browser, cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Σκοπός Επεξεργασίας</h2>
            <p>Χρησιμοποιούμε τα δεδομένα σας για:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Παροχή υπηρεσιών διαχείρισης προπόνησης και κρατήσεων</li>
              <li>Επικοινωνία σχετικά με τον λογαριασμό σας</li>
              <li>Βελτίωση της πλατφόρμας και των υπηρεσιών μας</li>
              <li>Συμμόρφωση με νομικές υποχρεώσεις</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Ενσωμάτωση Google Calendar</h2>
            <p>
              Η Πλατφόρμα προσφέρει προαιρετική ενσωμάτωση με το Google Calendar. Εάν επιλέξετε να
              συνδέσετε τον λογαριασμό σας Google, θα έχουμε πρόσβαση αποκλειστικά για τη δημιουργία
              events ημερολογίου που σχετίζονται με τις κρατήσεις και τις προπονήσεις σας. Δεν
              διαβάζουμε, τροποποιούμε ή διαγράφουμε υπάρχοντα events. Μπορείτε να ανακαλέσετε την
              πρόσβαση ανά πάσα στιγμή μέσω των ρυθμίσεων του Google λογαριασμού σας.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Κοινοποίηση Δεδομένων</h2>
            <p>
              Δεν πωλούμε τα δεδομένα σας σε τρίτους. Μοιραζόμαστε δεδομένα μόνο με:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Τον προπονητή/γυμναστή σας (δεδομένα προπόνησης και μετρήσεις)</li>
              <li>Παρόχους υπηρεσιών (Supabase για hosting, Google για Calendar)</li>
              <li>Αρχές, εφόσον απαιτείται από τον νόμο</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Ασφάλεια Δεδομένων</h2>
            <p>
              Εφαρμόζουμε τεχνικά και οργανωτικά μέτρα ασφαλείας, συμπεριλαμβανομένης της κρυπτογράφησης
              δεδομένων κατά τη μεταφορά (SSL/TLS), ελέγχου πρόσβασης βάσει ρόλων (RLS) και ασφαλούς
              αποθήκευσης κωδικών πρόσβασης.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Τα Δικαιώματά σας</h2>
            <p>Σύμφωνα με τον GDPR, έχετε δικαίωμα:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Πρόσβασης στα δεδομένα σας</li>
              <li>Διόρθωσης ανακριβών δεδομένων</li>
              <li>Διαγραφής («δικαίωμα στη λήθη»)</li>
              <li>Περιορισμού της επεξεργασίας</li>
              <li>Φορητότητας δεδομένων</li>
              <li>Εναντίωσης στην επεξεργασία</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Cookies</h2>
            <p>
              Χρησιμοποιούμε μόνο απαραίτητα cookies για τη λειτουργία της πλατφόρμας (π.χ. session
              authentication). Δεν χρησιμοποιούμε cookies παρακολούθησης ή διαφήμισης.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Διατήρηση Δεδομένων</h2>
            <p>
              Διατηρούμε τα δεδομένα σας για όσο διάστημα διατηρείτε ενεργό λογαριασμό. Μετά τη
              διαγραφή του λογαριασμού σας, τα δεδομένα διαγράφονται εντός 30 ημερών, εκτός εάν
              υπάρχει νομική υποχρέωση διατήρησης.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Επικοινωνία</h2>
            <p>
              Για ερωτήσεις σχετικά με την πολιτική απορρήτου ή για την άσκηση των δικαιωμάτων σας,
              επικοινωνήστε μαζί μας στο:{' '}
              <a href="mailto:info@hyperkids.gr" className="text-primary underline">
                info@hyperkids.gr
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
