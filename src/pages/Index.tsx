import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, Target, TrendingUp, Star, Calendar, Clock, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100" style={{ fontFamily: 'Roobert, sans-serif' }}>
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Elite Performance</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <button onClick={() => scrollToSection('home')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Αρχική
                </button>
                <button onClick={() => scrollToSection('services')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Υπηρεσίες
                </button>
                <button onClick={() => scrollToSection('programs')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Προγράμματα
                </button>
                <button onClick={() => scrollToSection('blog')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Blog
                </button>
                <button onClick={() => scrollToSection('methodology')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Μεθοδολογία
                </button>
                <button onClick={() => scrollToSection('footer')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Επικοινωνία/Contact
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="outline">Σύνδεση</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-left">
            <h2 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
              <span className="block xl:inline">Elite Performance</span>
              <span className="block text-blue-600 xl:inline">Training</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 sm:mt-5 sm:text-md sm:max-w-md sm:mx-0 lg:mx-0">
              Είμαστε εδώ για να σας βοηθήσουμε να φτάσετε στο μέγιστο των δυνατοτήτων σας.
              Με την κατάλληλη καθοδήγηση και υποστήριξη, μπορείτε να επιτύχετε τους στόχους σας.
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
              <div className="rounded-md shadow">
                <a
                  href="#"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Ξεκινήστε τώρα
                </a>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <a
                  href="#"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                >
                  Μάθετε περισσότερα
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Υπηρεσίες</h2>
            <p className="text-lg text-gray-600">
              Προσφέρουμε μια ποικιλία υπηρεσιών για να σας βοηθήσουμε να επιτύχετε τους στόχους σας.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Personal Training</CardTitle>
                <CardDescription>Εξατομικευμένα προγράμματα προπόνησης</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Αποκτήστε ένα πρόγραμμα προπόνησης προσαρμοσμένο στις ανάγκες σας.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Star className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Διατροφική Υποστήριξη</CardTitle>
                <CardDescription>Συμβουλές διατροφής από ειδικούς</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Βελτιώστε τη διατροφή σας και αυξήστε την απόδοσή σας.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <CardTitle>Ομαδικά Προγράμματα</CardTitle>
                <CardDescription>Διασκεδαστικά και αποτελεσματικά προγράμματα</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Εγγραφείτε σε ένα από τα ομαδικά μας προγράμματα και γυμναστείτε με φίλους.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Προγράμματα</h2>
            <p className="text-lg text-gray-600">
              Επιλέξτε το πρόγραμμα που σας ταιριάζει και ξεκινήστε σήμερα.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Βασικό Πρόγραμμα</CardTitle>
                <CardDescription>Για αρχάριους</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Ένα πρόγραμμα για να ξεκινήσετε το ταξίδι σας στη γυμναστική.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Προχωρημένο Πρόγραμμα</CardTitle>
                <CardDescription>Για έμπειρους αθλητές</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Ένα πρόγραμμα για να βελτιώσετε την απόδοσή σας.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Ειδικό Πρόγραμμα</CardTitle>
                <CardDescription>Για συγκεκριμένους στόχους</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Ένα πρόγραμμα για να επιτύχετε τους στόχους σας.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Blog</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Διαβάστε τα τελευταία άρθρα για προπόνηση, διατροφή και αθλητική απόδοση
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video overflow-hidden">
                <img 
                  src="/lovable-uploads/4fd00710-90c7-423b-8f46-232a45929952.png" 
                  alt="Lift heavy training equipment" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Lift Heavy</CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="mb-2">Προπόνηση</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  Σήμερα, όπου η τεχνολογία έχει σημειώσει ραγδαία πρόοδο, η προπόνηση μπορεί να πραγματοποιηθεί υπό πιο ευνοϊκές συνθήκες. Η τεχνολογία έχει δημιουργήσει σημαντικά εργαλεία για την παρακολούθηση της προπόνησης...
                </p>
                <Button variant="outline" className="w-full">
                  Διαβάστε περισσότερα
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Elite Training Methodology */}
      <section id="methodology" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Elite Training Methodology</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Η μεθοδολογία μας βασίζεται σε επιστημονικά δεδομένα και προσαρμόζεται στις ανάγκες κάθε αθλητή
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Στοχευμένη Προπόνηση</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Κάθε πρόγραμμα προπόνησης σχεδιάζεται με βάση τους συγκεκριμένους στόχους και τις ανάγκες του αθλητή.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Συνεχής Παρακολούθηση</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Χρησιμοποιούμε τεχνολογία αιχμής για την παρακολούθηση της προόδου και την προσαρμογή των προγραμμάτων.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <CardTitle>Αποτελέσματα</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Η μεθοδολογία μας έχει αποδειχθεί αποτελεσματική στη βελτίωση της αθλητικής απόδοσης.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 bg-white rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Φάσεις Προγράμματος</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Αξιολόγηση</h4>
                  <p className="text-gray-600">Πλήρης αξιολόγηση της φυσικής κατάστασης και των στόχων</p>
                </div>
                <Progress value={100} className="w-24" />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Σχεδιασμός</h4>
                  <p className="text-gray-600">Δημιουργία εξατομικευμένου προγράμματος προπόνησης</p>
                </div>
                <Progress value={85} className="w-24" />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Εκτέλεση</h4>
                  <p className="text-gray-600">Υλοποίηση του προγράμματος με συνεχή καθοδήγηση</p>
                </div>
                <Progress value={70} className="w-24" />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">4</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Αξιολόγηση Αποτελεσμάτων</h4>
                  <p className="text-gray-600">Μέτρηση προόδου και προσαρμογή στρατηγικής</p>
                </div>
                <Progress value={45} className="w-24" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Elite Performance</h3>
              <p className="text-gray-400">
                Η Elite Performance είναι εδώ για να σας βοηθήσει να επιτύχετε τους στόχους σας.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Επικοινωνία</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-400">123 Main Street, City, Country</span>
                </li>
                <li className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-400">+1 555-123-4567</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-400">info@eliteperformance.com</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Ακολουθήστε μας</h3>
              <ul className="flex space-x-4">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <p className="text-gray-400">
                Εγγραφείτε στο newsletter μας για να λαμβάνετε τα τελευταία νέα και προσφορές.
              </p>
              <form>
                <input
                  type="email"
                  className="bg-gray-700 text-white rounded-md py-2 px-4 w-full mb-2"
                  placeholder="Your email"
                />
                <button className="bg-blue-600 text-white rounded-md py-2 px-4 w-full">
                  Εγγραφή
                </button>
              </form>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8">
            <p className="text-gray-400 text-center">
              &copy; 2023 Elite Performance. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
