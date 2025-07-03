import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { format } from "date-fns";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptData {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerVat?: string;
  customerEmail?: string;
  items: ReceiptItem[];
  subtotal: number;
  vat: number;
  total: number;
  date: string;
  startDate?: string;
  endDate?: string;
  myDataStatus: 'pending' | 'sent' | 'error';
  myDataId?: string;
}

interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

interface ReceiptPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export const ReceiptPreviewDialog: React.FC<ReceiptPreviewDialogProps> = ({
  isOpen,
  onClose,
  receipt
}) => {
  const downloadPDF = async () => {
    if (!receipt) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Αρχική θέση Y
      let yPos = 20;
      
      // Logo - προσθέτουμε την εικόνα
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '/lovable-uploads/dce6f194-3bc2-4d61-9253-4f976bf25f5f.png';
        
        await new Promise((resolve, reject) => {
          logoImg.onload = () => resolve(logoImg);
          logoImg.onerror = () => resolve(null);
        });
        
        if (logoImg.complete) {
          const logoWidth = 30;
          const logoHeight = 15;
          pdf.addImage(logoImg, 'PNG', 20, yPos, logoWidth, logoHeight);
        }
      } catch (error) {
        console.log('Logo not loaded, continuing without it');
      }
      
      yPos += 20;
      
      // Στοιχεία επιχείρησης
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ΖΥΓΟΥΡΗΣ ΓΕΩΡΓΙΟΣ ΛΑΖΑΡΟΣ', 20, yPos);
      yPos += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46 - ΘΕΣΣΑΛΟΝΙΚΗ 54627', 20, yPos);
      yPos += 5;
      pdf.text('ΑΦΜ: 128109909 | ΔΟΥ: Ε΄ ΘΕΣΣΑΛΟΝΙΚΗΣ', 20, yPos);
      yPos += 5;
      pdf.text('ΤΗΛ: 2310 529104', 20, yPos);
      yPos += 5;
      pdf.text('www.hyperkids.gr | info@hyperkids.gr', 20, yPos);
      yPos += 15;
      
      // Γραμμή διαχωρισμού
      pdf.setDrawColor(0, 255, 186);
      pdf.setLineWidth(2);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;
      
      // Τίτλος απόδειξης
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 255, 186);
      const titleWidth = pdf.getTextWidth('ΑΠΟΔΕΙΞΗ ΣΥΝΔΡΟΜΗΣ');
      pdf.text('ΑΠΟΔΕΙΞΗ ΣΥΝΔΡΟΜΗΣ', (pageWidth - titleWidth) / 2, yPos);
      yPos += 15;
      
      // Επαναφορά χρώματος κειμένου
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      
      // Στοιχεία απόδειξης
      pdf.setFont('helvetica', 'bold');
      pdf.text('Αριθμός Απόδειξης:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.receiptNumber, 70, yPos);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Έκδοση:', 130, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(format(new Date(receipt.date), 'dd/MM/yyyy'), 150, yPos);
      yPos += 8;
      
      // Γραμμή
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      yPos += 8;
      
      // Πελάτης
      pdf.setFont('helvetica', 'bold');
      pdf.text('Πελάτης:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.customerName, 70, yPos);
      yPos += 8;
      
      // ΑΦΜ αν υπάρχει
      if (receipt.customerVat) {
        pdf.line(20, yPos, pageWidth - 20, yPos);
        yPos += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.text('ΑΦΜ:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(receipt.customerVat, 70, yPos);
        yPos += 8;
      }
      
      // Ημερομηνίες έναρξης και λήξης
      if (receipt.startDate || receipt.endDate) {
        pdf.line(20, yPos, pageWidth - 20, yPos);
        yPos += 8;
        
        if (receipt.startDate) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Έναρξης:', 20, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.text(format(new Date(receipt.startDate), 'dd/MM/yyyy'), 50, yPos);
        }
        
        if (receipt.endDate) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Λήξης:', 100, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.text(format(new Date(receipt.endDate), 'dd/MM/yyyy'), 125, yPos);
        }
        yPos += 8;
      }
      
      yPos += 10;
      
      // Στοιχεία συνδρομής
      pdf.setFont('helvetica', 'bold');
      pdf.text('Στοιχεία Συνδρομής', 20, yPos);
      yPos += 10;
      
      // Items
      receipt.items.forEach((item) => {
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(20, yPos - 5, pageWidth - 40, 20);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.description, 25, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Ποσότητα: ${item.quantity}`, pageWidth - 60, yPos);
        yPos += 6;
        
        pdf.text(`Τιμή μονάδας: €${item.unitPrice.toFixed(2)}`, 25, yPos);
        pdf.text(`ΦΠΑ: ${item.vatRate}%`, pageWidth - 60, yPos);
        yPos += 15;
      });
      
      yPos += 5;
      
      // Σύνολα
      pdf.setFillColor(245, 245, 245);
      pdf.rect(20, yPos - 5, pageWidth - 40, 35, 'F');
      
      // Αξία συνδρομής
      pdf.setFont('helvetica', 'bold');
      pdf.text('Αξία Συνδρομής:', 25, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`€${receipt.subtotal.toFixed(2)}`, pageWidth - 50, yPos);
      yPos += 8;
      
      // ΦΠΑ
      pdf.setFont('helvetica', 'bold');
      pdf.text('ΦΠΑ (13%):', 25, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`€${receipt.vat.toFixed(2)}`, pageWidth - 50, yPos);
      yPos += 10;
      
      // Γραμμή διαχωρισμού
      pdf.setDrawColor(0, 255, 186);
      pdf.setLineWidth(2);
      pdf.line(25, yPos, pageWidth - 25, yPos);
      yPos += 8;
      
      // Σύνολο
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 255, 186);
      pdf.text('Σύνολο:', 25, yPos);
      pdf.text(`€${receipt.total.toFixed(2)}`, pageWidth - 60, yPos);
      
      // Footer
      yPos = pageHeight - 30;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'bold');
      const footerText1 = 'HYPERKIDS - Γυμναστήριο';
      const footerWidth1 = pdf.getTextWidth(footerText1);
      pdf.text(footerText1, (pageWidth - footerWidth1) / 2, yPos);
      yPos += 4;
      
      pdf.setFont('helvetica', 'normal');
      const footerText2 = 'Τηλ: +30 2310 529104 | Email: info@hyperkids.gr';
      const footerWidth2 = pdf.getTextWidth(footerText2);
      pdf.text(footerText2, (pageWidth - footerWidth2) / 2, yPos);
      yPos += 4;
      
      const footerText3 = 'Διεύθυνση: ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46 - ΘΕΣΣΑΛΟΝΙΚΗ 54627';
      const footerWidth3 = pdf.getTextWidth(footerText3);
      pdf.text(footerText3, (pageWidth - footerWidth3) / 2, yPos);
      
      pdf.save(`${receipt.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (!receipt) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Εστάλη';
      case 'pending': return 'Εκκρεμεί';
      case 'error': return 'Σφάλμα';
      default: return 'Άγνωστο';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Προεπισκόπηση Απόδειξης</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={downloadPDF}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Κατέβασμα PDF
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="rounded-none"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div id="receipt-content" className="bg-white p-6 mx-auto max-w-4xl border border-gray-200 text-sm">
          {/* Header with logo and business details */}
          <div className="flex items-start justify-between border-b-2 border-[#00ffba] pb-4 mb-6">
            <div className="flex-1">
              <div className="w-32 h-16 mb-3">
                <img 
                  src="/lovable-uploads/dce6f194-3bc2-4d61-9253-4f976bf25f5f.png" 
                  alt="HYPERKIDS Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>ΖΥΓΟΥΡΗΣ ΓΕΩΡΓΙΟΣ ΛΑΖΑΡΟΣ</strong></p>
                <p>ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46 - ΘΕΣΣΑΛΟΝΙΚΗ 54627</p>
                <p>ΑΦΜ: 128109909 | ΔΟΥ: Ε΄ ΘΕΣΣΑΛΟΝΙΚΗΣ</p>
                <p>ΤΗΛ: 2310 529104</p>
                <p>www.hyperkids.gr | info@hyperkids.gr</p>
              </div>
            </div>
            <div className="w-32 h-16">
              {/* Empty space to maintain balance */}
            </div>
          </div>

          {/* Receipt Title */}
          <h2 className="text-xl text-[#00ffba] text-center mb-4 font-semibold">ΑΠΟΔΕΙΞΗ ΣΥΝΔΡΟΜΗΣ</h2>

          {/* Receipt Info */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <div>
                <span className="font-semibold text-gray-900">Αριθμός Απόδειξης: </span>
                <span className="text-gray-600">{receipt.receiptNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">Έκδοση: </span>
                <span className="text-gray-600">{format(new Date(receipt.date), 'dd/MM/yyyy')}</span>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-semibold text-gray-900">Πελάτης:</span>
              <span className="text-gray-600">{receipt.customerName}</span>
            </div>
            {receipt.customerVat && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-900">ΑΦΜ:</span>
                <span className="text-gray-600">{receipt.customerVat}</span>
              </div>
            )}
            {(receipt.startDate || receipt.endDate) && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                {receipt.startDate && (
                  <div>
                    <span className="font-semibold text-gray-900">Έναρξης: </span>
                    <span className="text-gray-600">{format(new Date(receipt.startDate), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                {receipt.endDate && (
                  <div>
                    <span className="font-semibold text-gray-900">Λήξης: </span>
                    <span className="text-gray-600">{format(new Date(receipt.endDate), 'dd/MM/yyyy')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Στοιχεία Συνδρομής</h3>
            {receipt.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 p-3 mb-2">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">{item.description}</span>
                  <span className="text-gray-600">Ποσότητα: {item.quantity}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Τιμή μονάδας: €{item.unitPrice.toFixed(2)}</span>
                  <span>ΦΠΑ: {item.vatRate}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 border-l-4 border-[#00ffba]">
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="font-semibold text-gray-900">Αξία Συνδρομής:</span>
                <span className="text-gray-600">€{receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold text-gray-900">ΦΠΑ (13%):</span>
                <span className="text-gray-600">€{receipt.vat.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-[#00ffba] pt-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-2xl font-bold text-[#00ffba]">Σύνολο:</span>
                  <span className="text-2xl font-bold text-[#00ffba]">€{receipt.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <p><strong>HYPERKIDS</strong> - Γυμναστήριο</p>
            <p>Τηλ: +30 2310 529104 | Email: info@hyperkids.gr</p>
            <p>Διεύθυνση: ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46 - ΘΕΣΣΑΛΟΝΙΚΗ 54627</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};