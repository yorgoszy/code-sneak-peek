-- Update Movement Skills phase with full philosophy prompt
UPDATE training_phase_config 
SET description = 'MOVEMENT SKILLS - ΕΚΠΑΙΔΕΥΣΗ ΒΑΣΙΚΩΝ ΚΙΝΗΤΙΚΩΝ ΠΡΟΤΥΠΩΝ

ΣΚΟΠΟΣ:
Εκπαίδευση και υπενθύμιση βασικών κινήσεων για το άθλημα και την προπόνηση που ακολουθεί.

ΚΑΤΗΓΟΡΙΕΣ ΚΙΝΗΣΕΩΝ:
• Linear - Γραμμικές κινήσεις (push, pull, squat patterns)
• Lateral - Πλάγιες κινήσεις (side lunges, lateral bounds)
• Hinge - Κινήσεις άρθρωσης ισχίου (hip hinge patterns)
• Upper Push - Ωθήσεις άνω κορμού
• Upper Pull - Έλξεις άνω κορμού
• Squat - Κινήσεις κάθισης
• Rotation - Στροφικές κινήσεις
• Total Body - Ολόσωμες ασκήσεις

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 30-50% 1RM ή Bodyweight
• Sets: 2-3
• Reps: 6-10
• Tempo: 3.1.2 ή Controlled
• Rest: 30-60 sec

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Εκπαιδευτικός χαρακτήρας
• Ποιότητα > Ποσότητα
• Sport-specific κινήσεις
• Προετοιμασία για επόμενα blocks
• Διόρθωση δυσλειτουργιών'
WHERE phase_key = 'movement-skills';

-- Update Connecting Linking phase with full philosophy prompt
UPDATE training_phase_config 
SET description = 'CONNECTING LINKING - ΣΥΝΔΕΣΗ ΑΝΩ ΚΑΙ ΚΑΤΩ ΚΟΡΜΟΥ

ΣΚΟΠΟΣ:
Δουλεύουμε μεγάλες πολυαρθρικές ασκήσεις με σκοπό να μπορεί ο ασκούμενος να ελέγξει και να συνδέσει τον άνω με τον κάτω κορμό.

ΣΗΜΕΙΑ ΕΛΕΓΧΟΥ:
• Έλεγχος ώμων κατά την εκτέλεση
• Σωστή θέση οσφύος (neutral spine)
• Σωστή θέση ισχίων
• Σωστή θέση γονάτων

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Rotational - Στροφικές κινήσεις (MB rotational throws)
• Anti-Rotational - Αντι-στροφικές (Pallof press)
• Anti-Extension - Αντι-έκταση (Dead bugs, planks)
• Anti-Flexion - Αντι-κάμψη (Carries, good mornings)
• Compound - Σύνθετες ασκήσεις (TGU, crawls)

ΕΡΓΑΛΕΙΑ:
• Λάστιχα (bands)
• Μπάλες (medicine balls)
• Καλώδια (cables)
• Bodyweight

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: Bodyweight / Light load
• Sets: 3-5 (πολλά sets)
• Reps: 4-6 (λίγες επαναλήψεις)
• Tempo: 4.2.2 ή πιο αργό
• Rest: 45-90 sec

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Αργές, ελεγχόμενες επαναλήψεις
• Χωρίς επιβάρυνση ή ελαφριά
• Focus στη σύνδεση core
• Προετοιμασία για δυναμικές κινήσεις'
WHERE phase_key = 'connecting-linking';