
import React, { useState, useRef, useEffect } from 'react';

interface BlogSectionProps {
  translations: any;
}

const BlogSection: React.FC<BlogSectionProps> = ({ translations }) => {
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setSelectedArticle(null);
      }
    };

    if (selectedArticle) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedArticle]);

  const articles = {
    el: [
      {
        id: 1,
        title: "Lift Heavy",
        excerpt: "Η σημασία των υψηλών εντάσεων στην προπόνηση και πώς η τεχνολογία βελτιώνει την απόδοση.",
        image: "/lovable-uploads/d3af2c45-06a0-4a4b-ad64-5f11fbd9de62.png",
        date: "15 Μαΐου 2025",
        content: `Σήμερα, όπου η τεχνολογία έχει σημειώσει ραγδαία πρόοδο, η προπόνηση μπορεί να πραγματοποιηθεί υπό πιο ευνοϊκές συνθήκες. Η τεχνολογία έχει δημιουργήσει σημαντικά εργαλεία για την παρακολούθηση της προπόνησης, όπως GPS, επιταχυνσιόμετρα, καρδιοσυχνόμετρα και πολλά άλλα, βελτιώνοντας την ποιότητα της προπόνησης μέσω της ανατροφοδότησης που παρέχουν.

Υπάρχει μια εσφαλμένη αντίληψη πως, αν προπονηθείς σε υψηλή ένταση (85% του 1RM και πάνω), επειδή η άρση εκτελείται αργά, αυτό σημαίνει πως θα γίνεις πιο αργός. Αυτό δεν είναι απόλυτα ακριβές.

Είμαι υπέρ των υψηλών εντάσεων· δεν υπάρχει λόγος να τις αποφεύγεις. Απλώς πρέπει να εκτελούνται σωστά και τη σωστή στιγμή.

Το πιο σημαντικό στοιχείο είναι το προφίλ φορτίου-ταχύτητας του κάθε αθλητή, και για να δημιουργηθεί αυτό το προφίλ, είναι απαραίτητη η χρήση της τεχνολογίας.

Η μεταβολή του προφίλ φορτίου-ταχύτητας είναι αυτό που θα σε κάνει πιο γρήγορο και ισχυρότερο. Αυτό που μας δείχνει το προφίλ είναι ότι μια άρση στο 85% του 1RM εκτελείται με ταχύτητα περίπου 0.50 m/s, και αυτό που πρέπει να επιτευχθεί για να γίνεις πιο γρήγορος είναι να εκτελέσεις την ίδια άρση με μεγαλύτερη ταχύτητα (π.χ. 0.55 m/s).

Η ταχύτερη και ισχυρότερη εκτέλεση προέρχεται από την ικανότητα να εκτελείς πιο γρήγορα σε σχέση με την προηγούμενη προσπάθειά σου, και όχι απαραίτητα από τη μείωση της έντασης, όπως στο 35-45% του 1RM. Ακόμα και σε αυτές τις εντάσεις, ισχύει το ίδιο. Για να εκτελέσεις μια άρση γρηγορότερα, είναι απαραίτητο να αυξήσεις το 1RM σου. Για να αυξήσεις το 1RM, χρειάζεται μια ταχύτερη άρση. Αυτή η σχέση είναι αλληλένδετη και αμφίδρομη.

Δεν μπορείς να γίνεις πιο γρήγορος αν δεν μεταβάλεις το προφίλ φορτίου-ταχύτητας σου, και δεν μπορείς να το μεταβάλεις αν δεν αυξήσεις το 1RM σου.`
      },
      {
        id: 2,
        title: "Πρωταθλητής γεννιέσαι ή γίνεσαι;",
        excerpt: "Η σημασία του μυϊκού προφίλ στην αθλητική επιτυχία και η σχέση μεταξύ ταλέντου και σκληρής δουλειάς.",
        image: "/lovable-uploads/94ce3145-f7b9-430b-86e6-12bca58833d5.png",
        date: "15 Απριλίου 2025",
        content: `Στις δύο άκρες των κατηγοριών των αθλημάτων συναντάμε τα αθλήματα ισχύος, όπως είναι η άρση βαρών και τα 100μ σπριντ, και τα αθλήματα αντοχής, όπως είναι ο μαραθώνιος. Η βασική τους διαφορά εντοπίζεται στη διάρκεια της προσπάθειας. Στην πρώτη περίπτωση, η προσπάθεια διαρκεί 3-10-15-30 δευτερόλεπτα, ενώ στη δεύτερη, μπορεί να διαρκέσει 1-2-3, ακόμα και 4 ώρες. Αυτή είναι η αφετηρία για όλα. Κάθε άθλημα έχει το δικό του προφίλ, δηλαδή συγκεκριμένες βιολογικές και μεταβολικές απαιτήσεις από τον αθλητή. Ένας από τους πιο σημαντικούς παράγοντες είναι το βιολογικό προφίλ του αθλητή, δηλαδή ο τύπος των μυϊκών ινών του, που τον χαρακτηρίζει είτε ως αθλητή ισχύος είτε ως αθλητή αντοχής.

Εάν ένας αθλητής έχει περισσότερες τύπου Ι μυϊκές ίνες, γνωστές και ως «ερυθρές μυϊκές ίνες» λόγω της υψηλής περιεκτικότητάς τους σε αίμα και της μεγαλύτερης παροχής οξυγόνου, αυτές οι ίνες είναι ανθεκτικές στη διάρκεια και επιτρέπουν στον αθλητή να έχει καλές επιδόσεις σε αθλήματα αντοχής, όπως ο μαραθώνιος. Από την άλλη πλευρά, εάν ο αθλητής διαθέτει περισσότερες τύπου ΙΙ μυϊκές ίνες, τότε είναι πιο κατάλληλος για αθλήματα μικρής διάρκειας, όπως τα σπριντ, το άλμα εις ύψος, το ακόντιο και η άρση βαρών.

Το μυϊκό προφίλ του κάθε αθλητή δεν αλλάζει με την προπόνηση· έτσι γεννιέται και έτσι πεθαίνει. Πρέπει να ταιριάζει με τις απαιτήσεις του εκάστοτε αθλήματος, ώστε να επιτυγχάνει τη μέγιστη απόδοση. Για παράδειγμα, στο άθλημα της άρσης βαρών, που απαιτεί τύπου ΙΙ μυϊκές ίνες, θα πρέπει να το επιλέξει ένας αθλητής με το κατάλληλο προφίλ. Όσο μεγαλύτερη είναι η αναλογία των τύπου ΙΙ μυϊκών ινών, τόσο περισσότερες είναι οι πιθανότητες επιτυχίας.

Σε αυτή την περίπτωση, μπορούμε να πούμε ότι «πρωταθλητής γεννιέσαι».

Από την άλλη, όλοι γεννιόμαστε με ένα συγκεκριμένο μυϊκό προφίλ που ταιριάζει σε ένα άθλημα· το μόνο που μένει είναι να το ανακαλύψουμε. Αυτό είναι το πρώτο βήμα για την επιτυχία· χρειάζεται αφοσίωση, σκληρή προπόνηση και έναν καλό προπονητή για να φτάσεις στην κορυφή. Χρειάζεται στόχο, προσπάθεια και ιδρώτα. Σε αυτή την περίπτωση, μπορούμε να πούμε ότι «πρωταθλητής γίνεσαι».

Δεν είναι θέμα τύχης ή ταλέντου· είναι αποτέλεσμα σκληρής δουλειάς προς τη σωστή κατεύθυνση.

Join the camp to be a champ!`
      },
      {
        id: 3,
        title: "Ένα αποδοτικό ζέσταμα",
        excerpt: "Η σημασία του ζεστάματος στην προπόνηση και η εφαρμογή της αρχής του μεγέθους.",
        image: "/lovable-uploads/b535e536-1d28-4df9-bc04-904228d8bfd5.png",
        date: "15 Μαρτίου 2025",
        content: `Ένα Αποδοτικό Ζέσταμα
Το ζέσταμα αποτελεί ένα από τα πιο κρίσιμα στάδια της προπόνησης, καθώς προετοιμάζει το σώμα για τη σωματική δραστηριότητα και μειώνει τον κίνδυνο τραυματισμών. Μια βασική αρχή που μπορεί να κάνει το ζέσταμα πιο αποδοτικό είναι η "αρχή του μεγέθους", η οποία αφορά τη σταδιακή ενεργοποίηση των μυϊκών ινών. Μέσω αυτής της αρχής, οι μυϊκές ίνες ενεργοποιούνται με έναν προοδευτικό τρόπο που βελτιώνει την απόδοση και την ασφάλεια του σώματος κατά την άσκηση.

Πώς Λειτουργεί η Αρχή του Μεγέθους
Σύμφωνα με την αρχή του μεγέθους, οι μικρότερες και πιο αργές κινητικές μονάδες (τύπου Ι μυϊκές ίνες) ενεργοποιούνται πρώτες κατά τη διάρκεια ασκήσεων χαμηλής έντασης. Καθώς η ένταση αυξάνεται, κινητοποιούνται οι μεγαλύτερες και ταχύτερες ίνες (τύπου ΙΙ) για να παράγουν περισσότερη δύναμη. Για ένα αποδοτικό ζέσταμα, αυτή η σταδιακή ενεργοποίηση επιτρέπει στο σώμα να προσαρμοστεί σταδιακά σε μεγαλύτερα φορτία, βελτιώνοντας τόσο τη νευρομυϊκή λειτουργία όσο και την απόδοση.

Οφέλη του Ζεστάματος με την Αρχή του Μεγέθους
Βελτιωμένη Νευρομυϊκή Λειτουργία: Η σταδιακή ενεργοποίηση των κινητικών μονάδων επιτρέπει στο νευρικό σύστημα να λειτουργεί πιο αποδοτικά, εξασφαλίζοντας την κατάλληλη προετοιμασία για τις κύριες ασκήσεις.
Προστασία από Τραυματισμούς: Η ομαλή μετάβαση από τις μικρότερες στις μεγαλύτερες κινητικές μονάδες μειώνει τον κίνδυνο ξαφνικών καταπονήσεων και τραυματισμών.
Βέλτιστη Απόδοση: Όταν ενεργοποιούνται οι κατάλληλες μυϊκές ίνες τη σωστή στιγμή, το σώμα μπορεί να αποδώσει καλύτερα και με μεγαλύτερη ασφάλεια στην κύρια προπόνηση.
 
Στάδια Ενός Αποδοτικού Ζεστάματος
Αύξηση Θερμοκρασίας Σώματος
Το πρώτο βήμα στο ζέσταμα είναι η αύξηση της θερμοκρασίας του σώματος. Αυτό μπορεί να επιτευχθεί με αερόβιες ασκήσεις χαμηλής έντασης, όπως ελαφρύ τρέξιμο, ποδήλατο ή σχοινάκι. Αυτό ενεργοποιεί τις τύπου Ι μυϊκές ίνες, οι οποίες είναι υπεύθυνες για τη σταθεροποίηση και την αντοχή.

Βελτίωση του Εύρους Κίνησης στις Αρθρώσεις
Στη συνέχεια, πρέπει να εστιάσουμε στην κινητικότητα των αρθρώσεων μέσω δυναμικών διατάσεων. Αυτές οι ασκήσεις διατείνουν τους σφιγμένους μύες και προετοιμάζουν τις αρθρώσεις για πιο σύνθετες και απαιτητικές κινήσεις. Παραδείγματα περιλαμβάνουν περιστροφές των ώμων, προβολές με κίνηση και δυναμικές κάμψεις.

Ενεργοποίηση των Κινητικών Μονάδων
Τώρα, μπορούμε να αρχίσουμε να ενεργοποιούμε τις κινητικές μονάδες, προχωρώντας από τις μικρότερες προς τις μεγαλύτερες. Αυτό επιτυγχάνεται με τη χρήση ελαφρών ασκήσεων σταθεροποίησης για τις τύπου Ι μυϊκές ίνες, όπως ισομετρικές ασκήσεις (π.χ. σανίδα), και συνεχίζουμε με ελαφριά φορτία ή αντίσταση.

Αύξηση της Έντασης
Σταδιακά, προχωράμε σε πιο έντονες ασκήσεις, αυξάνοντας το φορτίο ή την ταχύτητα. Αυτή η φάση προετοιμάζει το σώμα για τις απαιτητικές κινήσεις της κύριας προπόνησης, ενεργοποιώντας τις γρήγορες μυϊκές ίνες (τύπου ΙΙ). Παραδείγματα περιλαμβάνουν άλματα, εκρηκτικές προβολές και βαλλιστικές κινήσεις.

Νευρική Ετοιμότητα
Μετά την ολοκλήρωση του ζεστάματος, το νευρικό σύστημα είναι πλήρως ενεργοποιημένο και έτοιμο για την προπόνηση. Οι μυϊκές ίνες έχουν ενεργοποιηθεί σωστά, το σώμα είναι σε κατάλληλη θερμοκρασία και η κινητικότητα των αρθρώσεων έχει βελτιωθεί, παρέχοντας την ιδανική βάση για ασκήσεις υψηλής έντασης.

Συμπέρασμα
Ένα καλά σχεδιασμένο ζέσταμα με βάση την αρχή του μεγέθους προετοιμάζει τόσο το σώμα όσο και το μυαλό για τη σωματική δραστηριότητα. Με σταδιακή αύξηση της έντασης και ενεργοποίηση όλων των μυϊκών ινών, επιτυγχάνεται η βέλτιστη απόδοση και αποφεύγονται οι τραυματισμοί. Το ζέσταμα είναι το θεμέλιο για μια ασφαλή και αποτελεσματική προπόνηση.`
      }
    ],
    en: [
      {
        id: 1,
        title: "Lift Heavy",
        excerpt: "The importance of high-intensity training and how technology improves performance.",
        image: "/lovable-uploads/d3af2c45-06a0-4a4b-ad64-5f11fbd9de62.png",
        date: "May 15, 2025",
        content: `Today, where technology has made rapid progress, training can be carried out under more favorable conditions. Technology has created significant tools for monitoring training, such as GPS, accelerometers, heart rate monitors and many others, improving the quality of training through the feedback they provide.

There is a misconception that if you train at high intensity (85% of 1RM and above), because the lift is performed slowly, this means you will become slower. This is not entirely accurate.

I am in favor of high intensities; there is no reason to avoid them. They just need to be executed correctly and at the right time.

The most important element is the load-velocity profile of each athlete, and to create this profile, the use of technology is essential.

The change in the load-velocity profile is what will make you faster and stronger. What the profile shows us is that a lift at 85% of 1RM is performed at a speed of about 0.50 m/s, and what needs to be achieved to become faster is to perform the same lift at a higher speed (e.g. 0.55 m/s).

Faster and stronger execution comes from the ability to execute faster relative to your previous attempt, and not necessarily from reducing intensity, such as at 35-45% of 1RM. Even at these intensities, the same applies. To execute a lift faster, it is necessary to increase your 1RM. To increase your 1RM, you need a faster lift. This relationship is interconnected and bidirectional.

You cannot become faster if you do not change your load-velocity profile, and you cannot change it if you do not increase your 1RM.`
      },
      {
        id: 2,
        title: "Are Champions Born or Made?",
        excerpt: "The importance of muscle profile in athletic success and the relationship between talent and hard work.",
        image: "/lovable-uploads/94ce3145-f7b9-430b-86e6-12bca58833d5.png",
        date: "April 15, 2025",
        content: `At the two extremes of sports categories, we encounter power sports, such as weightlifting and 100m sprint, and endurance sports, such as the marathon. Their basic difference lies in the duration of the effort. In the first case, the effort lasts 3-10-15-30 seconds, while in the second, it can last 1-2-3, even 4 hours. This is the starting point for everything. Each sport has its own profile, that is, specific biological and metabolic requirements from the athlete. One of the most important factors is the biological profile of the athlete, that is, the type of muscle fibers they have, which characterizes them either as a power athlete or as an endurance athlete.

If an athlete has more Type I muscle fibers, also known as "red muscle fibers" due to their high blood content and greater oxygen supply, these fibers are endurance resistant and allow the athlete to perform well in endurance sports, such as the marathon. On the other hand, if the athlete has more Type II muscle fibers, then they are more suitable for short-duration sports, such as sprints, high jump, javelin and weightlifting.

The muscle profile of each athlete does not change with training; they are born this way and die this way. It must match the requirements of each sport in order to achieve maximum performance. For example, in the sport of weightlifting, which requires Type II muscle fibers, it should be chosen by an athlete with the appropriate profile. The greater the proportion of Type II muscle fibers, the greater the chances of success.

In this case, we can say that "champions are born".

On the other hand, we are all born with a specific muscle profile that suits a sport; all that remains is to discover it. This is the first step to success; it takes dedication, hard training and a good coach to reach the top. It takes goals, effort and sweat. In this case, we can say that "champions are made".

It is not a matter of luck or talent; it is the result of hard work in the right direction.

Join the camp to be a champ!`
      },
      {
        id: 3,
        title: "An Efficient Warm-up",
        excerpt: "The importance of warming up in training and the application of the size principle.",
        image: "/lovable-uploads/b535e536-1d28-4df9-bc04-904228d8bfd5.png",
        date: "March 15, 2025",
        content: `An Efficient Warm-up
Warming up is one of the most critical stages of training, as it prepares the body for physical activity and reduces the risk of injury. A basic principle that can make warming up more efficient is the "size principle," which concerns the gradual activation of muscle fibers. Through this principle, muscle fibers are activated in a progressive way that improves the performance and safety of the body during exercise.

How the Size Principle Works
According to the size principle, smaller and slower motor units (Type I muscle fibers) are activated first during low-intensity exercises. As intensity increases, larger and faster fibers (Type II) are mobilized to produce more force. For an efficient warm-up, this gradual activation allows the body to gradually adapt to greater loads, improving both neuromuscular function and performance.

Benefits of Warming Up with the Size Principle
Improved Neuromuscular Function: The gradual activation of motor units allows the nervous system to function more efficiently, ensuring proper preparation for the main exercises.
Protection from Injuries: The smooth transition from smaller to larger motor units reduces the risk of sudden stress and injuries.
Optimal Performance: When the appropriate muscle fibers are activated at the right time, the body can perform better and with greater safety in the main training.

Stages of an Efficient Warm-up
Body Temperature Increase
The first step in warming up is increasing body temperature. This can be achieved with low-intensity aerobic exercises, such as light running, cycling or jumping rope. This activates Type I muscle fibers, which are responsible for stabilization and endurance.

Joint Range of Motion Improvement
Next, we need to focus on joint mobility through dynamic stretches. These exercises stretch tight muscles and prepare joints for more complex and demanding movements. Examples include shoulder rotations, moving lunges and dynamic bends.

Motor Unit Activation
Now, we can begin to activate motor units, progressing from smaller to larger ones. This is achieved by using light stabilization exercises for Type I muscle fibers, such as isometric exercises (e.g. plank), and continuing with light loads or resistance.

Intensity Increase
Gradually, we progress to more intense exercises, increasing load or speed. This phase prepares the body for the demanding movements of the main training, activating fast muscle fibers (Type II). Examples include jumps, explosive lunges and ballistic movements.

Neural Readiness
After completing the warm-up, the nervous system is fully activated and ready for training. Muscle fibers have been properly activated, the body is at an appropriate temperature and joint mobility has been improved, providing the ideal foundation for high-intensity exercises.

Conclusion
A well-designed warm-up based on the size principle prepares both body and mind for physical activity. With gradual intensity increase and activation of all muscle fibers, optimal performance is achieved and injuries are avoided. Warming up is the foundation for safe and effective training.`
      }
    ]
  };

  const getBibliography = (articleId: number, language: string) => {
    if (articleId === 1) {
      // Lift Heavy bibliography
      if (language === 'el') {
        return `
<div class="text-xs text-gray-600 mt-6">
<strong>Βιβλιογραφία:</strong><br/>
Haff, G. G., & Triplett, N. T. (2015). Essentials of Strength Training and Conditioning. Human Kinetics.<br/>
González-Badillo, J. J., & Sánchez-Medina, L. (2010). Movement velocity as a measure of loading intensity in resistance training. International Journal of Sports Medicine, 31(05), 347-352.<br/>
Izquierdo, M., Häkkinen, K., González-Badillo, J. J., Ibáñez, J., & Gorostiaga, E. M. (2002). Effects of long-term training specificity on maximal strength and power of the upper and lower extremities in athletes from different sports. European Journal of Applied Physiology, 87(3), 264-271.<br/>
Zatsiorsky, V. M., & Kraemer, W. J. (2006). Science and Practice of Strength Training. Human Kinetics.<br/>
García-Ramos, A., & Jaric, S. (2018). Optimization of the load-velocity relationship obtained through linear regression: Comparison of two alternative methods. Journal of Sports Sciences, 36(20), 2405-2412.
</div>`;
      } else {
        return `
<div class="text-xs text-gray-600 mt-6">
<strong>Bibliography:</strong><br/>
Haff, G. G., & Triplett, N. T. (2015). Essentials of Strength Training and Conditioning. Human Kinetics.<br/>
González-Badillo, J. J., & Sánchez-Medina, L. (2010). Movement velocity as a measure of loading intensity in resistance training. International Journal of Sports Medicine, 31(05), 347-352.<br/>
Izquierdo, M., Häkkinen, K., González-Badillo, J. J., Ibáñez, J., & Gorostiaga, E. M. (2002). Effects of long-term training specificity on maximal strength and power of the upper and lower extremities in athletes from different sports. European Journal of Applied Physiology, 87(3), 264-271.<br/>
Zatsiorsky, V. M., & Kraemer, W. J. (2006). Science and Practice of Strength Training. Human Kinetics.<br/>
García-Ramos, A., & Jaric, S. (2018). Optimization of the load-velocity relationship obtained through linear regression: Comparison of two alternative methods. Journal of Sports Sciences, 36(20), 2405-2412.
</div>`;
      }
    } else if (articleId === 3) {
      // Warm-up bibliography
      if (language === 'el') {
        return `
<div class="text-xs text-gray-600 mt-6">
<strong>Βιβλιογραφία:</strong><br/>
Henneman, E., Somjen, G., & Carpenter, D. O. (1965). Excitability and inhibitability of motoneurons of different sizes. Journal of Neurophysiology, 28(3), 599-620.<br/>
Enoka, R. M. (2008). Neuromechanics of Human Movement (4th ed.). Human Kinetics.<br/>
Powers, S. K., & Howley, E. T. (2017). Exercise Physiology: Theory and Application to Fitness and Performance (10th ed.). McGraw-Hill.<br/>
McArdle, W. D., Katch, F. I., & Katch, V. L. (2015). Exercise Physiology: Nutrition, Energy, and Human Performance (8th ed.). Lippincott Williams & Wilkins.<br/>
Behm, D. G., & Chaouachi, A. (2011). A Review of the Acute Effects of Static and Dynamic Stretching on Performance. European Journal of Applied Physiology, 111(11), 2633-2651.
</div>`;
      } else {
        return `
<div class="text-xs text-gray-600 mt-6">
<strong>Bibliography:</strong><br/>
Henneman, E., Somjen, G., & Carpenter, D. O. (1965). Excitability and inhibitability of motoneurons of different sizes. Journal of Neurophysiology, 28(3), 599-620.<br/>
Enoka, R. M. (2008). Neuromechanics of Human Movement (4th ed.). Human Kinetics.<br/>
Powers, S. K., & Howley, E. T. (2017). Exercise Physiology: Theory and Application to Fitness and Performance (10th ed.). McGraw-Hill.<br/>
McArdle, W. D., Katch, F. I., & Katch, V. L. (2015). Exercise Physiology: Nutrition, Energy, and Human Performance (8th ed.). Lippincott Williams & Wilkins.<br/>
Behm, D. G., & Chaouachi, A. (2011). A Review of the Acute Effects of Static and Dynamic Stretching on Performance. European Journal of Applied Physiology, 111(11), 2633-2651.
</div>`;
      }
    }
    return '';
  };

  const currentLanguage = translations.language || 'el';
  const currentArticles = articles[currentLanguage] || articles.el;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
            {translations.blog?.title || 'Blog & Άρθρα'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {translations.blog?.subtitle || 'Ενημερωθείτε με τα τελευταία άρθρα και συμβουλές από τους ειδικούς μας'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentArticles.map((article) => (
            <article key={article.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="text-sm text-[#00ffba] mb-2">{article.date}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Robert, sans-serif' }}>
                  {article.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                <button 
                  onClick={() => setSelectedArticle(article)}
                  className="text-[#00ffba] hover:text-[#00cc96] font-semibold transition-colors"
                >
                  {translations.blog?.readMore || 'Διαβάστε περισσότερα →'}
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div 
              ref={modalRef}
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                <img 
                  src={selectedArticle.image} 
                  alt={selectedArticle.title}
                  className="w-full h-64 object-cover"
                />
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-8">
                <div className="text-sm text-[#00ffba] mb-2">{selectedArticle.date}</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Robert, sans-serif' }}>
                  {selectedArticle.title}
                </h2>
                <div className="prose prose-lg max-w-none text-gray-700">
                  {selectedArticle.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div dangerouslySetInnerHTML={{ __html: getBibliography(selectedArticle.id, currentLanguage) }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
