import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, CameraOff, Scan, User, Clock, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface QRScannerAttendanceProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QRScannerAttendance: React.FC<QRScannerAttendanceProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [sectionInfo, setSectionInfo] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Start camera
  const startCamera = async () => {
    try {
      setError(null);
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
      setError('Σφάλμα πρόσβασης στην κάμερα. Παρακαλώ ελέγξτε τις άδειες.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    setUserInfo(null);
    setSectionInfo(null);
    setError(null);
  };

  // Handle dialog close
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Handle QR code
  const handleQRCode = async (qrCode: string) => {
    try {
      setError(null);
      
      // Decode QR code to get user ID
      let userId: string;
      try {
        userId = atob(qrCode);
      } catch {
        setError('Μη έγκυρος QR κώδικας');
        return;
      }
      
      // Get user info with section
      const { data: user, error: userError } = await supabase
        .from('app_users')
        .select('*, booking_sections(id, name)')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        setError('Δεν βρέθηκε χρήστης');
        return;
      }

      setUserInfo(user);
      
      if (user.section_id && user.booking_sections) {
        setSectionInfo(user.booking_sections);
      } else {
        setSectionInfo(null);
      }
      
    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Σφάλμα επεξεργασίας QR κώδικα');
    }
  };

  // Record visit
  const recordVisit = async () => {
    if (!userInfo) return;

    setIsRecording(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = format(new Date(), 'HH:00');

      // If user has a section, create booking_sessions entry
      if (userInfo.section_id) {
        const { error: bookingError } = await supabase
          .from('booking_sessions')
          .insert({
            user_id: userInfo.id,
            section_id: userInfo.section_id,
            booking_date: today,
            booking_time: now,
            booking_type: 'gym',
            status: 'completed'
          });

        if (bookingError) throw bookingError;
      }

      // Also record in visits table
      const { error: visitError } = await supabase.rpc('record_visit', {
        p_user_id: userInfo.id,
        p_visit_type: 'qr_scan',
        p_notes: userInfo.section_id 
          ? `QR scan - ${sectionInfo?.name || 'Τμήμα'}` 
          : 'QR scan'
      });

      if (visitError) throw visitError;

      toast({
        title: "Επιτυχία!",
        description: `Παρουσία καταγράφηκε για ${userInfo.name}${sectionInfo ? ` - ${sectionInfo.name}` : ''}`
      });

      onSuccess?.();
      stopCamera();
      setUserInfo(null);
      setSectionInfo(null);
      
    } catch (error) {
      console.error('Error recording visit:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα καταγραφής παρουσίας"
      });
    } finally {
      setIsRecording(false);
    }
  };

  // Simulate QR scan (for testing)
  const simulateQRScan = async () => {
    // Get first user with section
    const { data: users } = await supabase
      .from('app_users')
      .select('qr_code')
      .not('section_id', 'is', null)
      .limit(1);
    
    if (users && users[0] && users[0].qr_code) {
      await handleQRCode(users[0].qr_code);
    } else {
      // Fallback to any user
      const { data: anyUsers } = await supabase
        .from('app_users')
        .select('qr_code')
        .limit(1);
      
      if (anyUsers && anyUsers[0] && anyUsers[0].qr_code) {
        await handleQRCode(anyUsers[0].qr_code);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Auto-start camera when dialog opens
  useEffect(() => {
    if (isOpen && !isScanning) {
      startCamera();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-[#00ffba]" />
            Σάρωση QR Παρουσίας
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-none">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

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
                  className="w-full h-48 bg-black rounded-none object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-[#00ffba] rounded-none pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-[#00ffba] rounded-none"></div>
                </div>
              </div>
              
              {userInfo && (
                <div className="bg-green-50 p-4 rounded-none border border-green-200">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={userInfo.avatar_url} />
                      <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba]">
                        {userInfo.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-green-800">{userInfo.name}</div>
                      <div className="text-sm text-green-600">{userInfo.email}</div>
                      {sectionInfo && (
                        <div className="text-xs text-[#cb8954] font-medium mt-1">
                          📍 {sectionInfo.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600 mt-3">
                    <Clock className="h-3 w-3" />
                    <span>{new Date().toLocaleTimeString('el-GR')}</span>
                  </div>
                  <Button 
                    onClick={recordVisit}
                    disabled={isRecording}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white rounded-none"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isRecording ? 'Καταγραφή...' : 'Καταγραφή Παρουσίας'}
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={simulateQRScan}
                  className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Demo Scan
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
