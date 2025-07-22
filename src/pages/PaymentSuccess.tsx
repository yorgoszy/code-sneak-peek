import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Receipt } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Here you could verify the payment with Stripe if needed
    console.log('Payment successful, session ID:', sessionId);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full rounded-none">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-[#00ffba]" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Επιτυχής Πληρωμή!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">
            Η πληρωμή σου ολοκληρώθηκε με επιτυχία. Θα λάβεις email επιβεβαίωσης σύντομα.
          </p>

          {sessionId && (
            <div className="bg-gray-50 p-4 rounded-none border">
              <p className="text-sm text-gray-500 mb-1">ID Συναλλαγής:</p>
              <p className="text-xs font-mono text-gray-700 break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Τι ακολουθεί:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• Θα λάβεις email επιβεβαίωσης</li>
              <li>• Οι επισκέψεις θα προστεθούν στον λογαριασμό σου</li>
              <li>• Μπορείς να δεις τις αγορές σου στο προφίλ σου</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              asChild 
              variant="outline" 
              className="flex-1 rounded-none"
            >
              <Link to="/shop">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Πίσω στις Αγορές
              </Link>
            </Button>
            
            <Button 
              asChild 
              className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Link to="/dashboard">
                <Receipt className="w-4 h-4 mr-2" />
                Προφίλ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;