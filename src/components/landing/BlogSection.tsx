
import React, { useState } from 'react';

interface BlogSectionProps {
  translations: any;
}

const BlogSection: React.FC<BlogSectionProps> = ({ translations }) => {
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const articles = {
    el: [
      {
        id: 1,
        title: "Lift Heavy",
        excerpt: "Η σημασία των υψηλών εντάσεων στην προπόνηση και πώς η τεχνολογία βελτιώνει την απόδοση.",
        image: "/lovable-uploads/d3af2c45-06a0-4a4b-ad64-5f11fbd9de62.png",
        date: "15 Νοεμβρίου 2024",
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
        date: "10 Νοεμβρίου 2024",
        content: `Στις δύο άκρες των κατηγοριών των αθλημάτων συναντάμε τα αθλήματα ισχύος, όπως είναι η άρση βαρών και τα 100μ σπριντ, και τα αθλήματα αντοχής, όπως είναι ο μαραθώνιος. Η βασική τους διαφορά εντοπίζεται στη διάρκεια της προσπάθειας. Στην πρώτη περίπτωση, η προσπάθεια διαρκεί 3-10-15-30 δευτερόλεπτα, ενώ στη δεύτερη, μπορεί να διαρκέσει 1-2-3, ακόμα και 4 ώρες. Αυτή είναι η αφετηρία για όλα. Κάθε άθλημα έχει το δικό του προφίλ, δηλαδή συγκεκριμένες βιολογικές και μεταβολικές απαιτήσεις από τον αθλητή. Ένας από τους πιο σημαντικούς παράγοντες είναι το βιολογικό προφίλ του αθλητή, δηλαδή ο τύπος των μυϊκών ινών του, που τον χαρακτηρίζει είτε ως αθλητή ισχύος είτε ως αθλητή αντοχής.

Εάν ένας αθλητής έχει περισσότερες τύπου Ι μυϊκές ίνες, γνωστές και ως «ερυθρές μυϊκές ίνες» λόγω της υψηλής περιεκτικότητάς τους σε αίμα και της μεγαλύτερης παροχής οξυγόνου, αυτές οι ίνες είναι ανθεκτικές στη διάρκεια και επιτρέπουν στον αθλητή να έχει καλές επιδόσεις σε αθλήματα αντοχής, όπως ο μαραθώνιος. Από την άλλη πλευρά, εάν ο αθλητής διαθέτει περισσότερες τύπου ΙΙ μυϊκές ίνες, τότε είναι πιο κατάλληλος για αθλήματα μικρής διάρκειας, όπως τα σπριντ, το άλμα εις ύψος, το ακόντιο και η άρση βαρών.

Το μυϊκό προφίλ του κάθε αθλητή δεν αλλάζει με την προπόνηση· έτσι γεννιέται και έτσι πεθαίνει. Πρέπει να ταιριάζει με τις απαιτήσεις του εκάστοτε αθλήματος, ώστε να επιτυγχάνει τη μέγιστη απόδοση. Για παράδειγμα, στο άθλημα της άρσης βαρών, που απαιτεί τύπου ΙΙ μυϊκές ίνες, θα πρέπει να το επιλέξει ένας αθλητής με το κατάλληλο προφίλ. Όσο μεγαλύτερη είναι η αναλογία των τύπου ΙΙ μυϊκών ινών, τόσο περισσότερες είναι οι πιθανότητες επιτυχίας.

Σε αυτή την περίπτωση, μπορούμε να πούμε ότι «πρωταθλητής γεννιέσαι».

Από την άλλη, όλοι γεννιόμαστε με ένα συγκεκριμένο μυϊκό προφίλ που ταιριάζει σε ένα άθλημα· το μόνο που μένει είναι να το ανακαλύψουμε. Αυτό είναι το πρώτο βήμα για την επιτυχία· χρειάζεται αφοσίωση, σκληρή προπόνηση και έναν καλό προπονητή για να φτάσεις στην κορυφή. Χρειάζεται στόχο, προσπάθεια και ιδρώτα. Σε αυτή την περίπτωση, μπορούμε να πούμε ότι «πρωταθλητής γίνεσαι».

Δεν είναι θέμα τύχης ή ταλέντου· είναι αποτέλεσμα σκληρής δουλειάς προς τη σωστή κατεύθυνση.

Join the camp to be a champ!

Βιβλιογραφία:
Lieber, R. L. (2010). Skeletal Muscle Structure, Function, and Plasticity. Lippincott Williams & Wilkins.
Zatsiorsky, V. M., & Kraemer, W. J. (2006). Science and Practice of Strength Training. Human Kinetics.
Fitts, R. H., & Widrick, J. J. (1996). Muscle mechanics: adaptations with exercise-training. Exercise and Sport Sciences Reviews, 24(1), 427-473.
Kenney, W. L., Wilmore, J., & Costill, D. (2020). Physiology of Sport and Exercise. Human Kinetics.
Bergh, U., & Thorstensson, A. (1977). Muscle characteristics in elite athletes. Medicine and Science in Sports, 9(2), 82-86.`
      },
      {
        id: 3,
        title: "Νεανική Δύναμη",
        excerpt: "Η σημασία της προπόνησης δύναμης στους νέους αθλητές.",
        image: "/lovable-uploads/f8f84c19-d969-4da5-a85d-fe764201fc6b.png",
        date: "5 Νοεμβρίου 2024",
        content: "Περιεχόμενο άρθρου για τη νεανική δύναμη..."
      }
    ],
    en: [
      {
        id: 1,
        title: "Lift Heavy",
        excerpt: "The importance of high-intensity training and how technology improves performance.",
        image: "/lovable-uploads/d3af2c45-06a0-4a4b-ad64-5f11fbd9de62.png",
        date: "November 15, 2024",
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
        date: "November 10, 2024",
        content: `At the two extremes of sports categories, we encounter power sports, such as weightlifting and 100m sprint, and endurance sports, such as the marathon. Their basic difference lies in the duration of the effort. In the first case, the effort lasts 3-10-15-30 seconds, while in the second, it can last 1-2-3, even 4 hours. This is the starting point for everything. Each sport has its own profile, that is, specific biological and metabolic requirements from the athlete. One of the most important factors is the biological profile of the athlete, that is, the type of muscle fibers they have, which characterizes them either as a power athlete or as an endurance athlete.

If an athlete has more Type I muscle fibers, also known as "red muscle fibers" due to their high blood content and greater oxygen supply, these fibers are endurance resistant and allow the athlete to perform well in endurance sports, such as the marathon. On the other hand, if the athlete has more Type II muscle fibers, then they are more suitable for short-duration sports, such as sprints, high jump, javelin and weightlifting.

The muscle profile of each athlete does not change with training; they are born this way and die this way. It must match the requirements of each sport in order to achieve maximum performance. For example, in the sport of weightlifting, which requires Type II muscle fibers, it should be chosen by an athlete with the appropriate profile. The greater the proportion of Type II muscle fibers, the greater the chances of success.

In this case, we can say that "champions are born".

On the other hand, we are all born with a specific muscle profile that suits a sport; all that remains is to discover it. This is the first step to success; it takes dedication, hard training and a good coach to reach the top. It takes goals, effort and sweat. In this case, we can say that "champions are made".

It is not a matter of luck or talent; it is the result of hard work in the right direction.

Join the camp to be a champ!

Bibliography:
Lieber, R. L. (2010). Skeletal Muscle Structure, Function, and Plasticity. Lippincott Williams & Wilkins.
Zatsiorsky, V. M., & Kraemer, W. J. (2006). Science and Practice of Strength Training. Human Kinetics.
Fitts, R. H., & Widrick, J. J. (1996). Muscle mechanics: adaptations with exercise-training. Exercise and Sport Sciences Reviews, 24(1), 427-473.
Kenney, W. L., Wilmore, J., & Costill, D. (2020). Physiology of Sport and Exercise. Human Kinetics.
Bergh, U., & Thorstensson, A. (1977). Muscle characteristics in elite athletes. Medicine and Science in Sports, 9(2), 82-86.`
      },
      {
        id: 3,
        title: "Youth Strength",
        excerpt: "The importance of strength training in young athletes.",
        image: "/lovable-uploads/f8f84c19-d969-4da5-a85d-fe764201fc6b.png",
        date: "November 5, 2024",
        content: "Content about youth strength training..."
      }
    ]
  };

  const currentLanguage = translations.language || 'el';
  const currentArticles = articles[currentLanguage] || articles.el;

  const handleArticleClick = (article: any) => {
    setSelectedArticle(article);
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  return (
    <>
      <section id="blog" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {currentLanguage === 'el' ? 'Άρθρα' : 'Articles'}
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {currentLanguage === 'el' 
                ? 'Ανακαλύψτε τα τελευταία άρθρα μας για προπόνηση, αθλητισμό και υγεία'
                : 'Discover our latest articles on training, sports and health'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentArticles.map((article) => (
              <div 
                key={article.id}
                className="bg-gray-900 overflow-hidden cursor-pointer hover:bg-gray-800 transition-colors duration-300"
                onClick={() => handleArticleClick(article)}
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-2">
                    <span className="text-sm text-gray-400">{article.date}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{article.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{article.excerpt}</p>
                  <div className="mt-4">
                    <span className="text-sm font-medium" style={{ color: '#00ffba' }}>
                      {currentLanguage === 'el' ? 'Διαβάστε περισσότερα →' : 'Read more →'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={handleCloseArticle}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                style={{ fontSize: '24px' }}
              >
                ✕
              </button>
              
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="p-8">
                <div className="mb-4">
                  <span className="text-sm text-gray-400">{selectedArticle.date}</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-6">{selectedArticle.title}</h1>
                <div className="prose prose-invert max-w-none">
                  {selectedArticle.content.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index} className="text-gray-300 mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlogSection;
