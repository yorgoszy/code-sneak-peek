import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2 } from "lucide-react";

interface UserQRCodeProps {
  user: {
    id: string;
    name: string;
    qr_code?: string;
  };
  size?: number;
}

export const UserQRCode: React.FC<UserQRCodeProps> = ({ user, size = 200 }) => {
  // Generate QR code placeholder (στην πραγματικότητα θα χρησιμοποιούσες μια QR library)
  const generateQRPlaceholder = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    canvas.width = size;
    canvas.height = size;
    
    // Simple QR-like pattern
    ctx.fillStyle = '#000000';
    const blockSize = size / 20;
    
    // Create a simple pattern
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        if ((i + j) % 3 === 0 || (i % 5 === 0 && j % 7 === 0)) {
          ctx.fillRect(i * blockSize, j * blockSize, blockSize, blockSize);
        }
      }
    }
    
    return canvas.toDataURL();
  };

  const downloadQR = () => {
    const dataUrl = generateQRPlaceholder();
    const link = document.createElement('a');
    link.download = `qr-${user.name.replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code - ${user.name}`,
          text: `QR Code για τον/την ${user.name}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  return (
    <Card className="rounded-none max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center">
          <QrCode className="h-5 w-5" />
          QR Code - {user.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div 
            className="border-2 border-gray-300 rounded-none p-4 bg-white"
            style={{ width: size + 32, height: size + 32 }}
          >
            <img 
              src={generateQRPlaceholder()}
              alt={`QR Code για ${user.name}`}
              className="w-full h-full"
            />
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          <p>ID: {user.id.substring(0, 8)}...</p>
          {user.qr_code && (
            <p className="font-mono text-xs bg-gray-100 p-2 rounded-none mt-2">
              {user.qr_code}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={downloadQR}
            variant="outline"
            className="flex-1 rounded-none"
          >
            <Download className="h-4 w-4 mr-2" />
            Λήψη
          </Button>
          <Button 
            onClick={shareQR}
            variant="outline"
            className="flex-1 rounded-none"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Κοινοποίηση
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};