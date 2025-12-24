-- Update Functional Hypertrophy phase
UPDATE training_phase_config 
SET description = 'FUNCTIONAL HYPERTROPHY - ΛΕΙΤΟΥΡΓΙΚΗ ΥΠΕΡΤΡΟΦΙΑ

ΣΚΟΠΟΣ:
Αύξηση μυϊκής μάζας με ταυτόχρονη βελτίωση λειτουργικότητας και αθλητικής απόδοσης.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Συνδυασμός υπερτροφίας με νευρομυϊκή προσαρμογή
• Πολυαρθρικές ασκήσεις με αθλητικό χαρακτήρα
• Έμφαση στη μεταφορά δύναμης στο άθλημα
• Ισορροπία μεταξύ μυϊκής ανάπτυξης και ταχύτητας

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Olympic variations - Παραλλαγές άρσης βαρών
• Compound movements - Σύνθετες κινήσεις
• Unilateral exercises - Μονόπλευρες ασκήσεις
• Power-based hypertrophy - Υπερτροφία με δύναμη

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 70-85% 1RM
• Sets: 3-5
• Reps: 6-10
• Tempo: 3.0.1 ή 2.0.1
• Rest: 90-120 sec

ΕΦΑΡΜΟΓΗ:
• Αθλητές που χρειάζονται μάζα χωρίς απώλεια ταχύτητας
• Μετάβαση από υπερτροφία σε δύναμη
• Αθλητές δυναμικών αθλημάτων'
WHERE phase_key = 'functional-hypertrophy';

-- Update Non-Functional Hypertrophy phase
UPDATE training_phase_config 
SET description = 'NON-FUNCTIONAL HYPERTROPHY - ΜΗ ΛΕΙΤΟΥΡΓΙΚΗ ΥΠΕΡΤΡΟΦΙΑ

ΣΚΟΠΟΣ:
Μέγιστη αύξηση μυϊκής μάζας με έμφαση στον όγκο και την αισθητική.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Μυϊκή απομόνωση για στοχευμένη ανάπτυξη
• Υψηλός όγκος προπόνησης
• Μεταβολική καταπόνηση
• Μηχανική τάση για μέγιστη υπερτροφία

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Isolation exercises - Ασκήσεις απομόνωσης
• Machine-based work - Εργασία σε μηχανήματα
• Cable exercises - Ασκήσεις με καλώδια
• Bodybuilding movements - Κινήσεις bodybuilding

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 60-75% 1RM
• Sets: 3-5
• Reps: 8-15
• Tempo: 3.1.2 ή 4.0.2
• Rest: 60-90 sec

ΤΕΧΝΙΚΕΣ:
• Drop sets
• Super sets
• Rest-pause
• Time under tension

ΕΦΑΡΜΟΓΗ:
• Bodybuilders
• Αισθητική βελτίωση
• Διόρθωση μυϊκών ανισορροπιών'
WHERE phase_key = 'non-functional-hypertrophy';

-- Update Hypertrophy phase
UPDATE training_phase_config 
SET description = 'HYPERTROPHY - ΥΠΕΡΤΡΟΦΙΑ

ΣΚΟΠΟΣ:
Αύξηση μυϊκής μάζας μέσω βέλτιστου συνδυασμού έντασης, όγκου και μεταβολικού stress.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Ισορροπημένη προσέγγιση υπερτροφίας
• Συνδυασμός πολυαρθρικών και μονοαρθρικών
• Προοδευτική υπερφόρτωση
• Επαρκής χρόνος υπό τάση

ΜΗΧΑΝΙΣΜΟΙ ΥΠΕΡΤΡΟΦΙΑΣ:
• Μηχανική τάση (mechanical tension)
• Μεταβολικό stress (metabolic stress)
• Μυϊκή βλάβη (muscle damage)

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 65-80% 1RM
• Sets: 3-4
• Reps: 8-12
• Tempo: 3.0.2 ή 2.1.1
• Rest: 60-120 sec

ΕΒΔΟΜΑΔΙΑΙΟΣ ΟΓΚΟΣ:
• 10-20 sets ανά μυϊκή ομάδα
• Προοδευτική αύξηση όγκου
• Deload κάθε 4-6 εβδομάδες

ΕΦΑΡΜΟΓΗ:
• Γενική μυϊκή ανάπτυξη
• Βάση για δύναμη
• Βελτίωση σύνθεσης σώματος'
WHERE phase_key = 'hypertrophy';

-- Update Maximal Strength phase
UPDATE training_phase_config 
SET description = 'MAXIMAL STRENGTH - ΜΕΓΙΣΤΗ ΔΥΝΑΜΗ

ΣΚΟΠΟΣ:
Ανάπτυξη μέγιστης δύναμης μέσω νευρομυϊκών προσαρμογών και βελτίωση της ικανότητας παραγωγής μέγιστης δύναμης.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Υψηλή ένταση (>85% 1RM)
• Χαμηλές επαναλήψεις (1-5)
• Πλήρης ανάκαμψη μεταξύ sets
• Νευρομυϊκή βελτιστοποίηση

ΝΕΥΡΟΜΥΪΚΕΣ ΠΡΟΣΑΡΜΟΓΕΣ:
• Αύξηση recruitment μονάδων
• Βελτίωση rate coding
• Ενδομυϊκός συντονισμός
• Διαμυϊκός συντονισμός

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Squat variations - Παραλλαγές squat
• Deadlift variations - Παραλλαγές deadlift
• Bench/Press variations - Πιέσεις
• Olympic lifts - Άρσεις βαρών

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 85-100% 1RM
• Sets: 3-6
• Reps: 1-5
• Tempo: Controlled eccentric, explosive concentric
• Rest: 3-5 min

ΕΦΑΡΜΟΓΗ:
• Powerlifters
• Αθλητές δύναμης
• Peaking πριν αγώνες'
WHERE phase_key = 'maximal-strength';

-- Update Power phase
UPDATE training_phase_config 
SET description = 'POWER - ΙΣΧΥΣ

ΣΚΟΠΟΣ:
Ανάπτυξη ισχύος (Power = Force × Velocity) - ικανότητα παραγωγής δύναμης με υψηλή ταχύτητα.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Εκρηκτικές κινήσεις
• Μέτρια ένταση με μέγιστη ταχύτητα
• Πλήρης ανάκαμψη
• Ποιότητα εκτέλεσης

ΤΥΠΟΙ ΙΣΧΥΟΣ:
• Starting strength - Αρχική δύναμη
• Explosive strength - Εκρηκτική δύναμη
• Reactive strength - Αντιδραστική δύναμη

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Olympic lifts & variations
• Ballistic exercises (jumps, throws)
• Plyometrics
• Weighted jumps

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 30-70% 1RM (ανάλογα με την άσκηση)
• Sets: 3-6
• Reps: 1-5
• Tempo: Explosive
• Rest: 2-4 min

VELOCITY ZONES:
• Starting strength: 0.5-0.75 m/s
• Accelerative: 0.75-1.0 m/s
• Speed-strength: 1.0-1.3 m/s
• Speed: >1.3 m/s

ΕΦΑΡΜΟΓΗ:
• Αθλητές ταχύτητας/ισχύος
• Sprinters, jumpers
• Αθλητές ομαδικών'
WHERE phase_key = 'power';

-- Update Explosive Strength phase
UPDATE training_phase_config 
SET description = 'EXPLOSIVE STRENGTH - ΕΚΡΗΚΤΙΚΗ ΔΥΝΑΜΗ

ΣΚΟΠΟΣ:
Ανάπτυξη της ικανότητας παραγωγής μέγιστης δύναμης στον ελάχιστο δυνατό χρόνο (Rate of Force Development - RFD).

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Μέγιστη επιτάχυνση από στάση
• Εκρηκτική έναρξη κίνησης
• Υψηλό RFD
• Νευρομυϊκή ενεργοποίηση

ΜΗΧΑΝΙΣΜΟΙ:
• Βελτίωση neural drive
• Fast-twitch recruitment
• Elastic energy utilization
• Stretch-shortening cycle

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Olympic lifts from blocks/hang
• Explosive pulls
• Jump squats
• Medicine ball throws
• Ballistic movements

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 50-80% 1RM
• Sets: 4-6
• Reps: 2-5
• Tempo: Maximum intent
• Rest: 2-4 min

ΤΕΧΝΙΚΕΣ:
• Compensatory acceleration
• Dynamic effort method
• Contrast training

ΕΦΑΡΜΟΓΗ:
• Sprinters
• Throwers
• Combat sports
• Power athletes'
WHERE phase_key = 'explosive-strength';

-- Update Reactive Strength phase
UPDATE training_phase_config 
SET description = 'REACTIVE STRENGTH - ΑΝΤΙΔΡΑΣΤΙΚΗ ΔΥΝΑΜΗ

ΣΚΟΠΟΣ:
Ανάπτυξη της ικανότητας γρήγορης μετάβασης από εκκεντρική σε ομόκεντρη σύσπαση (stretch-shortening cycle).

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Ελαχιστοποίηση χρόνου επαφής
• Αξιοποίηση ελαστικής ενέργειας
• Υψηλή στιφρότητα (stiffness)
• Αντανακλαστική δράση

REACTIVE STRENGTH INDEX (RSI):
• RSI = Jump Height / Ground Contact Time
• Στόχος: Μέγιστο ύψος με ελάχιστο χρόνο επαφής

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Depth jumps
• Hurdle hops
• Bounding
• Reactive plyometrics
• Drop jumps

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: Bodyweight ή ελαφρύ φορτίο
• Sets: 3-5
• Reps: 3-6
• Tempo: Reactive/Elastic
• Rest: 2-3 min
• Ground contact: <200ms

ΠΡΟΫΠΟΘΕΣΕΙΣ:
• Επαρκής βάση δύναμης
• Καλή τεχνική πλειομετρικών
• Υγιείς αρθρώσεις

ΕΦΑΡΜΟΓΗ:
• Jumpers
• Sprinters
• Team sport athletes
• Αθλητές με απαιτήσεις αλλαγής κατεύθυνσης'
WHERE phase_key = 'reactive-strength';

-- Update Starting Strength phase
UPDATE training_phase_config 
SET description = 'STARTING STRENGTH - ΑΡΧΙΚΗ ΔΥΝΑΜΗ

ΣΚΟΠΟΣ:
Ανάπτυξη της ικανότητας παραγωγής δύναμης από στατική θέση χωρίς προ-διάταση (no stretch-shortening cycle).

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Έναρξη από ακινησία
• Χωρίς countermovement
• Άμεση ενεργοποίηση
• Concentric-only emphasis

ΕΦΑΡΜΟΓΕΣ ΣΤΟ ΑΘΛΗΜΑ:
• Εκκίνηση sprint
• Πρώτο βήμα
• Αρχική επιτάχυνση
• Αλλαγές κατεύθυνσης

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Dead-start exercises
• Concentric-only movements
• Pin squats/presses
• Block pulls
• Static start jumps

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 60-80% 1RM
• Sets: 4-6
• Reps: 2-5
• Tempo: Pause at bottom, explosive concentric
• Rest: 2-3 min
• Pause: 2-3 sec at start position

ΤΕΧΝΙΚΕΣ:
• Paused reps
• Dead-stop reps
• Anderson squats
• Box squats (relaxed)

ΕΦΑΡΜΟΓΗ:
• Sprinters
• Football players
• Combat athletes
• Αθλητές με ανάγκη γρήγορης εκκίνησης'
WHERE phase_key = 'starting-strength';

-- Update Stabilization phase
UPDATE training_phase_config 
SET description = 'STABILIZATION - ΣΤΑΘΕΡΟΠΟΙΗΣΗ

ΣΚΟΠΟΣ:
Ανάπτυξη ικανότητας σταθεροποίησης αρθρώσεων και κορμού για αποτελεσματική μεταφορά δύναμης.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Ισομετρική εργασία
• Αντίσταση σε εξωτερικές δυνάμεις
• Core stability
• Joint centration

ΤΥΠΟΙ ΣΤΑΘΕΡΟΠΟΙΗΣΗΣ:
• Static stability - Στατική σταθερότητα
• Dynamic stability - Δυναμική σταθερότητα
• Reactive stability - Αντιδραστική σταθερότητα

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Anti-extension (planks, dead bugs)
• Anti-rotation (Pallof press)
• Anti-lateral flexion (side planks, carries)
• Unilateral stance work
• Balance challenges

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: Bodyweight ή ελαφρύ
• Sets: 2-4
• Reps: 6-12 ή χρόνος (20-45 sec)
• Tempo: Controlled/Isometric
• Rest: 30-60 sec

ΑΡΧΕΣ:
• Proximal stability → Distal mobility
• Core bracing πριν την κίνηση
• Neutral spine maintenance

ΕΦΑΡΜΟΓΗ:
• Injury prevention
• Rehabilitation
• Foundation building
• Αθλητές με αστάθεια'
WHERE phase_key = 'stabilization';

-- Update Endurance phase
UPDATE training_phase_config 
SET description = 'ENDURANCE - ΑΝΤΟΧΗ

ΣΚΟΠΟΣ:
Ανάπτυξη μυϊκής αντοχής και ικανότητας επαναλαμβανόμενης παραγωγής δύναμης για παρατεταμένο χρόνο.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Υψηλές επαναλήψεις
• Μικρές διαλείψεις
• Μεταβολική προσαρμογή
• Αντοχή στην κόπωση

ΤΥΠΟΙ ΑΝΤΟΧΗΣ:
• Muscular endurance - Μυϊκή αντοχή
• Strength endurance - Αντοχή δύναμης
• Power endurance - Αντοχή ισχύος

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Circuit training
• High-rep compound movements
• Complexes
• EMOMs
• AMRAPs

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 40-60% 1RM
• Sets: 2-4
• Reps: 15-25+
• Tempo: Controlled
• Rest: 30-60 sec

ΜΕΘΟΔΟΙ:
• Continuous training
• Interval training
• Circuit training
• Density training

ΕΦΑΡΜΟΓΗ:
• Endurance athletes
• Team sports
• Combat sports
• General fitness'
WHERE phase_key = 'endurance';

-- Update Corrective phase
UPDATE training_phase_config 
SET description = 'CORRECTIVE - ΔΙΟΡΘΩΤΙΚΗ

ΣΚΟΠΟΣ:
Διόρθωση μυϊκών ανισορροπιών, δυσλειτουργιών κίνησης και πρόληψη τραυματισμών.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Εξατομικευμένη προσέγγιση
• Βασισμένη σε αξιολόγηση
• Στοχευμένη παρέμβαση
• Επανεκπαίδευση κίνησης

ΔΙΑΔΙΚΑΣΙΑ:
1. Αξιολόγηση (FMS, postural analysis)
2. Εντοπισμός προβλημάτων
3. Σχεδιασμός παρέμβασης
4. Εφαρμογή διορθωτικών
5. Επαναξιολόγηση

ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:
• Foam rolling - Αυτομυοπεριτονιακή αποδέσμευση
• Stretching - Διατάσεις (στατικές/δυναμικές)
• Activation - Ενεργοποίηση αδύναμων μυών
• Integration - Ενσωμάτωση σε κίνηση

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: Χαμηλή
• Sets: 1-3
• Reps: 8-15 ή χρόνος (30-60 sec)
• Tempo: Slow, controlled
• Rest: Minimal

ΚΟΙΝΑ ΖΗΤΗΜΑΤΑ:
• Αδύναμα γλουτιαία
• Σφιχτοί καμπτήρες ισχίου
• Αδύναμος core
• Κακή κινητικότητα ώμου
• Valgus γόνατος

ΕΦΑΡΜΟΓΗ:
• Pre-workout correctives
• Injury rehabilitation
• Movement dysfunctions
• Postural issues'
WHERE phase_key = 'corrective';

-- Update SPD (Speed) phase if exists
UPDATE training_phase_config 
SET description = 'SPEED - ΤΑΧΥΤΗΤΑ

ΣΚΟΠΟΣ:
Ανάπτυξη μέγιστης ταχύτητας κίνησης με ελάχιστη εξωτερική αντίσταση.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Μέγιστη ταχύτητα εκτέλεσης
• Ελάχιστο φορτίο (0-30% 1RM)
• Πλήρης ανάκαμψη
• Νευρομυϊκή ακρίβεια

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 0-30% 1RM ή Bodyweight
• Sets: 4-8
• Reps: 1-5
• Tempo: Maximum velocity
• Rest: 2-5 min

VELOCITY TARGET: >1.3 m/s

ΚΑΤΗΓΟΡΙΕΣ:
• Ballistic throws
• Speed squats
• Speed pulls
• Jumping variations

ΕΦΑΡΜΟΓΗ:
• Velocity-based training
• Power development
• Speed athletes'
WHERE phase_key = 'spd';

-- Update STR/SPD (Strength-Speed) phase if exists
UPDATE training_phase_config 
SET description = 'STRENGTH-SPEED - ΔΥΝΑΜΗ-ΤΑΧΥΤΗΤΑ

ΣΚΟΠΟΣ:
Ανάπτυξη δύναμης με έμφαση στην ταχύτητα - η δύναμη είναι κυρίαρχη αλλά η ταχύτητα παραμένει σημαντική.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Μέτρια προς υψηλή ένταση
• Εκρηκτική πρόθεση
• Compensatory acceleration
• Ισορροπία δύναμης-ταχύτητας

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 55-80% 1RM
• Sets: 4-6
• Reps: 3-6
• Tempo: Controlled eccentric, explosive concentric
• Rest: 2-3 min

VELOCITY TARGET: 0.5-0.75 m/s

ΚΑΤΗΓΟΡΙΕΣ:
• Dynamic effort squats
• Speed deadlifts
• Explosive pressing
• Loaded jumps

ΜΕΘΟΔΟΙ:
• Westside dynamic effort
• French contrast
• Complex training

ΕΦΑΡΜΟΓΗ:
• Power athletes
• Strength sports
• Team sports'
WHERE phase_key = 'str-spd';

-- Update PWR (Power) phase if exists
UPDATE training_phase_config 
SET description = 'POWER DEVELOPMENT - ΑΝΑΠΤΥΞΗ ΙΣΧΥΟΣ

ΣΚΟΠΟΣ:
Βελτιστοποίηση της σχέσης δύναμης-ταχύτητας για μέγιστη παραγωγή ισχύος.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:
• Βέλτιστο φορτίο για μέγιστη ισχύ
• Εκρηκτικές κινήσεις
• Ολόσωμες ασκήσεις
• Transfer στο άθλημα

ΠΑΡΑΜΕΤΡΟΙ:
• Ένταση: 30-60% 1RM (optimal power zone)
• Sets: 4-6
• Reps: 2-5
• Tempo: Maximum power output
• Rest: 3-5 min

VELOCITY TARGET: 0.75-1.0 m/s

ΚΑΤΗΓΟΡΙΕΣ:
• Olympic lift variations
• Loaded jumps
• Medicine ball work
• Ballistic exercises

ΜΕΘΟΔΟΛΟΓΙΑ:
• Velocity-based training
• Auto-regulated loads
• Cluster sets for quality

ΕΦΑΡΜΟΓΗ:
• Peak power development
• Competition preparation
• Power-dominant sports'
WHERE phase_key = 'pwr';