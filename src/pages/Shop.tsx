import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, Users, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Shop = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const products = [
    {
      id: "visit-5",
      name: "Πακέτο 5 Επισκέψεων",
      price: 50,
      description: "5 επισκέψεις στο γυμναστήριο",
      icon: <Dumbbell className="w-6 h-6" />,
      badge: "Δημοφιλές"
    },
    {
      id: "visit-10", 
      name: "Πακέτο 10 Επισκέψεων",
      price: 90,
      description: "10 επισκέψεις στο γυμναστήριο",
      icon: <Dumbbell className="w-6 h-6" />,
      badge: "Καλύτερη Αξία"
    },
    {
      id: "personal-training",
      name: "Personal Training",
      price: 35,
      description: "1 ώρα προσωπική προπόνηση",
      icon: <Users className="w-6 h-6" />
    },
    {
      id: "consultation",
      name: "Συμβουλευτική Συνεδρία",
      price: 25,
      description: "30 λεπτά συμβουλευτική για διατροφή και προπόνηση",
      icon: <Clock className="w-6 h-6" />
    }
  ];

  const handlePurchase = async (product: typeof products[0]) => {
    setLoading(product.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: product.price,
          currency: "eur",
          productName: product.name
        }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Σφάλμα κατά τη δημιουργία πληρωμής');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Αγορές</h1>
          <p className="text-lg text-gray-600">
            Αγόρασε πακέτα επισκέψεων, personal training και άλλες υπηρεσίες
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="rounded-none hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-[#00ffba] text-black rounded-none mx-auto mb-4">
                  {product.icon}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  {product.badge && (
                    <Badge variant="secondary" className="rounded-none text-xs">
                      {product.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600">{product.description}</p>
              </CardHeader>
              
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">€{product.price}</span>
                </div>
                
                <Button 
                  onClick={() => handlePurchase(product)}
                  disabled={loading === product.id}
                  className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {loading === product.id ? 'Φόρτωση...' : 'Αγορά Τώρα'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-white border border-gray-200 rounded-none p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Πληροφορίες Αγοράς
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>• Οι πληρωμές επεξεργάζονται με ασφάλεια μέσω Stripe</p>
            <p>• Τα πακέτα επισκέψεων δεν έχουν ημερομηνία λήξης</p>
            <p>• Μπορείς να ακυρώσεις ή να αναβάλεις τα ραντεβού σου</p>
            <p>• Για περισσότερες πληροφορίες επικοινώνησε μαζί μας</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;