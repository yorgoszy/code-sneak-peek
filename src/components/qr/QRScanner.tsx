import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, CameraOff, Scan, User, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  onScanSuccess?: (userId: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Start camera
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      setStream(mediaStream);
      setIsScanning(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα πρόσβασης στην κάμερα. Παρακαλώ ελέγξτε τις άδειες."
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    setScanResult(null);
    setUserInfo(null);
  };

  // Simulate QR scan (στην πραγματικότητα θα χρησιμοποιούσες μια QR library)
  const simulateQRScan = async () => {
    // Για demo - θα πάρουμε τον πρώτο χρήστη
    const { data: users } = await supabase
      .from('app_users')
      .select('*')
      .limit(1);
    
    if (users && users[0]) {
      const qrCode = users[0].qr_code;
      await handleQRCode(qrCode);
    }
  };

  // Handle QR code scan
  const handleQRCode = async (qrCode: string) => {
    try {
      // Decode QR code to get user ID
      const userId = atob(qrCode);
      
      // Get user info
      const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Μη έγκυρος QR κώδικας"
        });
        return;
      }

      setUserInfo(user);
      setScanResult(qrCode);
      onScanSuccess?.(userId);
      
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα επεξεργασίας QR κώδικα"
      });
    }
  };

  // Record visit
  const recordVisit = async () => {
    if (!userInfo) return;

    try {
      const { error } = await supabase.rpc('record_visit', {
        p_user_id: userInfo.id,
        p_visit_type: 'qr_scan',
        p_notes: 'QR scan visit'
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: `Παρουσία καταγράφηκε για ${userInfo.name}!`
      });
      stopCamera();
      
    } catch (error) {
      console.error('Error recording visit:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα καταγραφής παρουσίας"
      });
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card className="rounded-none max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          QR Scanner Παρουσιών
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning ? (
          <div className="text-center space-y-4">
            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-none flex items-center justify-center">
              <Camera className="h-16 w-16 text-gray-400" />
            </div>
            <Button 
              onClick={startCamera}
              className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Camera className="h-4 w-4 mr-2" />
              Άνοιγμα Κάμερας
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-48 bg-black rounded-none"
              />
              <div className="absolute inset-0 border-2 border-[#00ffba] rounded-none">
                <div className="absolute top-2 left-2 right-2 h-8 border-t-2 border-[#00ffba]"></div>
                <div className="absolute bottom-2 left-2 right-2 h-8 border-b-2 border-[#00ffba]"></div>
              </div>
            </div>
            
            {scanResult && userInfo && (
              <div className="bg-green-50 p-4 rounded-none border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">{userInfo.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Clock className="h-3 w-3" />
                  <span>{new Date().toLocaleTimeString('el-GR')}</span>
                </div>
                <Button 
                  onClick={recordVisit}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white rounded-none"
                >
                  Καταγραφή Παρουσίας
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={simulateQRScan}
                className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
              <Button 
                onClick={stopCamera}
                variant="outline"
                className="rounded-none"
              >
                <CameraOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};