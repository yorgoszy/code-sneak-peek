import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Users, Zap, Shield, Heart, BookOpen, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-pink-500" />
              <span className="text-xl font-bold text-gray-900">HyperKids</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 transition-colors">Αρχική</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Χαρακτηριστικά</a>
              <a href="#blog" className="text-gray-700 hover:text-blue-600 transition-colors">Blog</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Επικοινωνία</a>
              
              {!loading && (
                isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <Link to="/dashboard">
                      <Button variant="outline" className="rounded-none">
                        Dashboard
                      </Button>
                    </Link>
                    <span className="text-sm text-gray-600">
                      {user?.email}
                    </span>
                    <Button 
                      variant="outline" 
                      className="rounded-none"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Αποσύνδεση
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" className="rounded-none">
                      Σύνδεση
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Καλώς ήρθατε στην HyperKids
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Η πλατφόρμα που μεταμορφώνει την εκπαίδευση των παιδιών σας.
          </p>
          <div className="flex justify-center space-x-4">
            <Button className="rounded-none" onClick={handleGetStarted}>
              {isAuthenticated ? "Πήγαινε στο Dashboard" : "Ξεκινήστε τώρα"} <ArrowRight className="ml-2" />
            </Button>
            <Button variant="outline" className="rounded-none">
              Μάθετε περισσότερα
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Βασικά Χαρακτηριστικά
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Zap className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Διαδραστικά Μαθήματα
              </h3>
              <p className="text-gray-700">
                Μαθήματα που προσαρμόζονται στις ανάγκες του κάθε παιδιού.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-green-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Users className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ομαδική Συνεργασία
              </h3>
              <p className="text-gray-700">
                Δυνατότητα συνεργασίας με άλλα παιδιά για την επίλυση προβλημάτων.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-yellow-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Star className="h-8 w-8 text-yellow-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Εξατομικευμένη Πρόοδος
              </h3>
              <p className="text-gray-700">
                Παρακολούθηση της προόδου του παιδιού σε πραγματικό χρόνο.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="bg-red-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Shield className="h-8 w-8 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ασφαλές Περιβάλλον
              </h3>
              <p className="text-gray-700">
                Προστασία των προσωπικών δεδομένων και ασφαλής πλοήγηση.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Heart className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Δημιουργικότητα & Έμπνευση
              </h3>
              <p className="text-gray-700">
                Ενθάρρυνση της δημιουργικότητας μέσω διασκεδαστικών δραστηριοτήτων.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="bg-teal-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <BookOpen className="h-8 w-8 text-teal-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Πλούσιο Εκπαιδευτικό Υλικό
              </h3>
              <p className="text-gray-700">
                Πρόσβαση σε μια μεγάλη βιβλιοθήκη εκπαιδευτικού υλικού.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Τελευταία Άρθρα του Blog
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Blog Post 1 */}
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <img
                src="https://source.unsplash.com/400x300/?education"
                alt="Education"
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Πώς να βοηθήσετε το παιδί σας να αγαπήσει τη μάθηση
                </h3>
                <p className="text-gray-700 mb-4">
                  Συμβουλές και στρατηγικές για να κάνετε τη μάθηση διασκεδαστική.
                </p>
                <a
                  href="#"
                  className="text-blue-600 hover:underline"
                >
                  Διαβάστε περισσότερα
                </a>
              </div>
            </div>
            {/* Blog Post 2 */}
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <img
                src="https://source.unsplash.com/400x300/?technology"
                alt="Technology"
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Η τεχνολογία στην εκπαίδευση: Ευκαιρίες και προκλήσεις
                </h3>
                <p className="text-gray-700 mb-4">
                  Ανάλυση των πλεονεκτημάτων και των μειονεκτημάτων της χρήσης της τεχνολογίας.
                </p>
                <a
                  href="#"
                  className="text-blue-600 hover:underline"
                >
                  Διαβάστε περισσότερα
                </a>
              </div>
            </div>
            {/* Blog Post 3 */}
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <img
                src="https://source.unsplash.com/400x300/?children"
                alt="Children"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Πώς να δημιουργήσετε ένα ασφαλές online περιβάλλον για τα παιδιά σας
                </h3>
                <p className="text-gray-700 mb-4">
                  Οδηγός για γονείς σχετικά με την ασφάλεια στο διαδίκτυο.
                </p>
                <a
                  href="#"
                  className="text-blue-600 hover:underline"
                >
                  Διαβάστε περισσότερα
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Εγγραφείτε σήμερα και ξεκινήστε το ταξίδι της μάθησης!
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Δημιουργήστε έναν λογαριασμό και αποκτήστε πρόσβαση σε όλο το εκπαιδευτικό υλικό.
          </p>
          <Button className="rounded-none" onClick={handleGetStarted}>
            {isAuthenticated ? "Πήγαινε στο Dashboard" : "Δημιουργήστε λογαριασμό"} <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Footer Section 1 */}
            <div>
              <h4 className="text-lg font-semibold mb-4">HyperKids</h4>
              <p className="text-gray-400">
                Η πλατφόρμα που μεταμορφώνει την εκπαίδευση των παιδιών σας.
              </p>
            </div>
            {/* Footer Section 2 */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Σύνδεσμοι</h4>
              <ul className="text-gray-400 space-y-2">
                <li>
                  <a href="#" className="hover:text-white">
                    Αρχική
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Χαρακτηριστικά
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Επικοινωνία
                  </a>
                </li>
              </ul>
            </div>
            {/* Footer Section 3 */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Επικοινωνία</h4>
              <p className="text-gray-400">
                123 Οδός Παράδεισος, Αθήνα
              </p>
              <p className="text-gray-400">
                Email: info@hyperkids.com
              </p>
              <p className="text-gray-400">
                Τηλέφωνο: +30 210 1234567
              </p>
            </div>
            {/* Footer Section 4 */}
            <div>
              <h4 className="text-lg font-semibold mb-4">
                Ακολουθήστε μας
              </h4>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white">
                  Facebook
                </a>
                <a href="#" className="hover:text-white">
                  Twitter
                </a>
                <a href="#" className="hover:text-white">
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 HyperKids. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
