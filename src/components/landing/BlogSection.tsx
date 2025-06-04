
import React, { useState } from 'react';

interface BlogSectionProps {
  translations: any;
}

const BlogSection: React.FC<BlogSectionProps> = ({ translations }) => {
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const articles = [
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
      title: "Κίνηση και Ανάπτυξη",
      excerpt: "Πώς η σωστή κίνηση αποτελεί τη βάση για κάθε αθλητική ανάπτυξη.",
      image: "/lovable-uploads/32d7b875-008c-4cca-a559-c707588d97de.png",
      date: "10 Νοεμβρίου 2024",
      content: "Περιεχόμενο άρθρου για την κίνηση..."
    },
    {
      id: 3,
      title: "Νεανική Δύναμη",
      excerpt: "Η σημασία της προπόνησης δύναμης στους νέους αθλητές.",
      image: "/lovable-uploads/f8f84c19-d969-4da5-a85d-fe764201fc6b.png",
      date: "5 Νοεμβρίου 2024",
      content: "Περιεχόμενο άρθρου για τη νεανική δύναμη..."
    }
  ];

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
            <h2 className="text-3xl font-bold text-white mb-4">Άρθρα</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Ανακαλύψτε τα τελευταία άρθρα μας για προπόνηση, αθλητισμό και υγεία
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
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
                      Διαβάστε περισσότερα →
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
