
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { trackContactForm } from "@/components/analytics/AnalyticsEvents";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track the contact form submission
    trackContactForm('contact_page');
    
    // Here you would normally send the form data to your backend
    console.log('Form submitted:', formData);
    
    // Reset form
    setFormData({ name: '', email: '', phone: '', message: '' });
    
    alert('Το μήνυμά σας στάλθηκε επιτυχώς! Θα επικοινωνήσουμε σύντομα μαζί σας.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Επικοινωνία
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Είμαστε εδώ για να σας βοηθήσουμε να επιτύχετε τους στόχους σας
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Στοιχεία Επικοινωνίας</h3>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-[#00ffba] p-3 rounded-full">
                    <Phone className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Τηλέφωνο</h4>
                    <p className="text-gray-600">+30 210 123 4567</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-[#00ffba] p-3 rounded-full">
                    <Mail className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600">info@hyperkids.gr</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-[#00ffba] p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Διεύθυνση</h4>
                    <p className="text-gray-600">Αθήνα, Ελλάδα</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Ώρες Λειτουργίας</h4>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Δευτέρα - Παρασκευή</span>
                  <span>06:00 - 22:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Σάββατο</span>
                  <span>08:00 - 20:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Κυριακή</span>
                  <span>10:00 - 18:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>Στείλτε μας μήνυμα</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    name="name"
                    placeholder="Όνομα"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="rounded-none"
                  />
                </div>

                <div>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="rounded-none"
                  />
                </div>

                <div>
                  <Input
                    name="phone"
                    placeholder="Τηλέφωνο"
                    value={formData.phone}
                    onChange={handleChange}
                    className="rounded-none"
                  />
                </div>

                <div>
                  <Textarea
                    name="message"
                    placeholder="Μήνυμα"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="min-h-[120px] rounded-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Αποστολή Μηνύματος
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
