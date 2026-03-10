import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService: React.FC = () => {
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

        <h1 className="text-3xl font-bold mb-2">Όροι Χρήσης</h1>
        <p className="text-muted-foreground mb-8">Τελευταία ενημέρωση: 10 Μαρτίου 2026</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Αποδοχή Όρων</h2>
            <p>
              Με τη χρήση της πλατφόρμας HyperKids (εφεξής «η Πλατφόρμα»), αποδέχεστε τους
              παρόντες Όρους Χρήσης. Εάν δεν συμφωνείτε, παρακαλούμε μην χρησιμοποιείτε την
              Πλατφόρμα.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Περιγραφή Υπηρεσίας</h2>
            <p>
              Η Πλατφόρμα HyperKids παρέχει υπηρεσίες διαχείρισης αθλητικής προπόνησης,
              συμπεριλαμβανομένων:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Δημιουργία και παρακολούθηση προγραμμάτων προπόνησης</li>
              <li>Σύστημα κρατήσεων γυμναστηρίου</li>
              <li>Καταγραφή μετρήσεων και αξιολογήσεων αθλητών</li>
              <li>Διαχείριση συνδρομών</li>
              <li>Βιντεοκλήσεις και online coaching</li>
              <li>Συγχρονισμό με Google Calendar</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Λογαριασμός Χρήστη</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Πρέπει να παρέχετε ακριβείς και πλήρεις πληροφορίες κατά την εγγραφή</li>
              <li>Είστε υπεύθυνοι για τη διατήρηση της ασφάλειας του κωδικού πρόσβασης</li>
              <li>Πρέπει να μας ενημερώσετε αμέσως για τυχόν μη εξουσιοδοτημένη χρήση</li>
              <li>Ένας λογαριασμός ανά χρήστη</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Χρήση Google Calendar</h2>
            <p>
              Η ενσωμάτωση με το Google Calendar είναι προαιρετική. Με την ενεργοποίησή της,
              εξουσιοδοτείτε την Πλατφόρμα να δημιουργεί events στο ημερολόγιό σας που αφορούν
              κρατήσεις και προπονήσεις. Η χρήση αυτής της λειτουργίας υπόκειται επίσης στους
              Όρους Χρήσης της Google.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Υποχρεώσεις Χρήστη</h2>
            <p>Συμφωνείτε να μην:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Χρησιμοποιείτε την Πλατφόρμα για παράνομους σκοπούς</li>
              <li>Παραβιάζετε δικαιώματα πνευματικής ιδιοκτησίας</li>
              <li>Μεταδίδετε κακόβουλο λογισμικό</li>
              <li>Επιχειρείτε μη εξουσιοδοτημένη πρόσβαση σε δεδομένα άλλων χρηστών</li>
              <li>Μοιράζεστε τα διαπιστευτήρια πρόσβασης</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Πνευματική Ιδιοκτησία</h2>
            <p>
              Όλο το περιεχόμενο της Πλατφόρμας (λογισμικό, σχεδίαση, λογότυπα, κείμενα)
              αποτελεί πνευματική ιδιοκτησία της HyperKids. Τα προγράμματα προπόνησης που
              δημιουργούνται από τους προπονητές ανήκουν στους αντίστοιχους δημιουργούς.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Περιορισμός Ευθύνης</h2>
            <p>
              Η Πλατφόρμα παρέχεται «ως έχει». Δεν φέρουμε ευθύνη για τραυματισμούς κατά τη
              διάρκεια προπονήσεων. Τα προγράμματα προπόνησης δημιουργούνται από τους
              προπονητές και η ευθύνη εφαρμογής τους ανήκει στους ίδιους και τους αθλητές.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Συνδρομές και Πληρωμές</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Οι τιμές συνδρομών καθορίζονται από τον εκάστοτε γυμναστήριο/προπονητή</li>
              <li>Οι πληρωμές γίνονται απευθείας στον προπονητή/γυμναστήριο</li>
              <li>Η Πλατφόρμα δεν μεσολαβεί στις οικονομικές συναλλαγές μεταξύ χρηστών</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Τερματισμός</h2>
            <p>
              Διατηρούμε το δικαίωμα να τερματίσουμε ή να αναστείλουμε τον λογαριασμό σας σε
              περίπτωση παραβίασης των παρόντων όρων. Μπορείτε να διαγράψετε τον λογαριασμό
              σας ανά πάσα στιγμή.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Τροποποιήσεις Όρων</h2>
            <p>
              Διατηρούμε το δικαίωμα τροποποίησης των παρόντων όρων. Θα ενημερωθείτε για
              ουσιαστικές αλλαγές μέσω email ή ειδοποίησης στην Πλατφόρμα.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">11. Εφαρμοστέο Δίκαιο</h2>
            <p>
              Οι παρόντες όροι διέπονται από το Ελληνικό δίκαιο. Αρμόδια δικαστήρια είναι τα
              δικαστήρια Αθηνών.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">12. Επικοινωνία</h2>
            <p>
              Για ερωτήσεις σχετικά με τους όρους χρήσης, επικοινωνήστε μαζί μας στο:{' '}
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

export default TermsOfService;
