
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Star, Zap, Shield, Users, Menu, X, Play } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-gray-900">
                  ModernApp
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#hero" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Home
                </a>
                <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Pricing
                </a>
                <a href="#contact" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Contact
                </a>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600">
                Sign In
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </div>
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-100 z-40">
          <div className="px-4 py-4 space-y-3">
            <a href="#hero" className="block text-gray-600 hover:text-gray-900 text-sm font-medium">
              Home
            </a>
            <a href="#features" className="block text-gray-600 hover:text-gray-900 text-sm font-medium">
              Features
            </a>
            <a href="#pricing" className="block text-gray-600 hover:text-gray-900 text-sm font-medium">
              Pricing
            </a>
            <a href="#contact" className="block text-gray-600 hover:text-gray-900 text-sm font-medium">
              Contact
            </a>
            <div className="pt-4 space-y-2">
              <Button variant="ghost" size="sm" className="w-full text-gray-600">
                Sign In
              </Button>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-8 bg-blue-50 text-blue-700 border-blue-200">
            ✨ Introducing our new AI platform
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Build the future
            <br />
            <span className="text-blue-600">
              with AI
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform your business with cutting-edge artificial intelligence. 
            Our platform makes AI accessible, powerful, and easy to integrate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700">
              Start building for free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              <Play className="mr-2 h-5 w-5" />
              Watch demo
            </Button>
          </div>
          
          {/* Hero Image Placeholder */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-blue-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="mt-6 flex space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
                  <div className="w-8 h-8 bg-green-100 rounded-full"></div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime guaranteed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">10M+</div>
              <div className="text-gray-600">API calls per month</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Companies trust us</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600">Expert support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools and features you need to build, deploy, and scale your AI-powered applications.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="h-7 w-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-3">Lightning Fast</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Deploy in seconds with our optimized infrastructure and global CDN network.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-7 w-7 text-green-600" />
                </div>
                <CardTitle className="text-xl mb-3">Enterprise Security</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Bank-level security with end-to-end encryption and compliance certifications.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-3">Team Collaboration</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Work together seamlessly with real-time collaboration and advanced permissions.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your needs. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200 hover:border-gray-300 transition-colors duration-300 relative">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-4">Starter</CardTitle>
                <div className="text-5xl font-bold text-gray-900 mb-2">$19</div>
                <CardDescription className="text-lg">per month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Up to 5 projects
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    10GB storage
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Email support
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Basic analytics
                  </li>
                </ul>
                <Button className="w-full mt-8" variant="outline">
                  Get Started
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-blue-500 relative hover:border-blue-600 transition-colors duration-300 shadow-lg">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-4">Professional</CardTitle>
                <div className="text-5xl font-bold text-gray-900 mb-2">$49</div>
                <CardDescription className="text-lg">per month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Unlimited projects
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    100GB storage
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Team collaboration
                  </li>
                </ul>
                <Button className="w-full mt-8 bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-gray-200 hover:border-gray-300 transition-colors duration-300">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-4">Enterprise</CardTitle>
                <div className="text-5xl font-bold text-gray-900 mb-2">$99</div>
                <CardDescription className="text-lg">per month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Everything in Pro
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Unlimited storage
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    24/7 phone support
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Custom integrations
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Dedicated manager
                  </li>
                </ul>
                <Button className="w-full mt-8" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of companies already building the future with our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
              Start building for free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
              Talk to sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4">ModernApp</div>
              <p className="text-gray-400 mb-6">
                Building the future of digital experiences with AI-powered solutions.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 cursor-pointer transition-colors">
                  <Star className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 cursor-pointer transition-colors">
                  <Star className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 cursor-pointer transition-colors">
                  <Star className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status Page</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ModernApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
