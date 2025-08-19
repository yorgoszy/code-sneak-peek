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

    const element = document.getElementById('receipt-content');
    if (!element) return;

    try {
      // Περιμένουμε να φορτώσουν όλες οι εικόνες
      const images = element.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 1000); // fallback timeout
        });
      }));

      // Βελτιωμένες ρυθμίσεις html2canvas για ακριβή αντιγραφή
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        ignoreElements: () => false,
        removeContainer: false,
        foreignObjectRendering: false,
        imageTimeout: 5000,
        onclone: (clonedDoc, clonedElement) => {
          // Εξασφαλίζουμε ότι το cloned element έχει τα ίδια styles
          const originalElement = document.getElementById('receipt-content');
          if (originalElement && clonedElement) {
            clonedElement.style.cssText = originalElement.style.cssText;
            clonedElement.style.display = 'block';
            clonedElement.style.visibility = 'visible';
            clonedElement.style.opacity = '1';
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'static';
            
            // Αντιγραφή όλων των inline styles από το original
            const allElements = originalElement.querySelectorAll('*');
            const clonedElements = clonedElement.querySelectorAll('*');
            
            allElements.forEach((el, index) => {
              if (clonedElements[index]) {
                (clonedElements[index] as HTMLElement).style.cssText = (el as HTMLElement).style.cssText;
              }
            });
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Υπολογισμός μεγέθους για να χωρέσει ακριβώς όπως στην προβολή
      const imgWidth = pdfWidth - 10; // 5mm margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (imgHeight <= pdfHeight - 10) {
        // Χωράει σε μία σελίδα
        pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
      } else {
        // Κλιμάκωση για να χωρέσει
        const scaledHeight = pdfHeight - 10;
        const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
        const x = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', x, 5, scaledWidth, scaledHeight);
      }
      
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
      <DialogContent className="max-w-5xl rounded-none sm:rounded-none w-full h-full sm:h-auto sm:w-auto overflow-y-auto sm:overflow-visible">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm sm:text-base">Προεπισκόπηση Απόδειξης</DialogTitle>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={downloadPDF}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                size="sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Κατέβασμα </span>PDF
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="rounded-none text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div id="receipt-content" className="bg-white p-2 sm:p-3 mx-auto max-w-4xl border border-gray-200 text-xs">
          {/* Header with logo and business details */}
          <div className="flex items-start justify-between border-b border-[#00ffba] pb-1 sm:pb-2 mb-2 sm:mb-3">
            <div className="flex-1">
              <div className="w-16 h-8 sm:w-24 sm:h-12 mb-1 sm:mb-2">
                <img 
                  src="/lovable-uploads/dce6f194-3bc2-4d61-9253-4f976bf25f5f.png" 
                  alt="HYPERKIDS Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="text-xs text-gray-700 space-y-0.5">
                <p><strong>ΖΥΓΟΥΡΗΣ ΓΕΩΡΓΙΟΣ ΛΑΖΑΡΟΣ</strong></p>
                <p className="text-xs sm:text-xs">ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46 - ΘΕΣΣΑΛΟΝΙΚΗ 54627</p>
                <p className="text-xs sm:text-xs">ΑΦΜ: 128109909 | ΔΟΥ: Ε΄ ΘΕΣΣΑΛΟΝΙΚΗΣ</p>
                <p className="text-xs sm:text-xs">ΤΗΛ: 2310 529104</p>
                <p className="text-xs sm:text-xs">www.hyperkids.gr | info@hyperkids.gr</p>
              </div>
            </div>
          </div>

          {/* Receipt Title */}
          <h2 className="text-sm sm:text-lg text-[#00ffba] text-center mb-1 sm:mb-2 font-semibold">ΑΠΟΔΕΙΞΗ ΣΥΝΔΡΟΜΗΣ</h2>

          {/* Receipt Info */}
          <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3">
            <div className="flex flex-col sm:flex-row sm:justify-between py-0.5 sm:py-1 border-b border-gray-200">
              <div className="mb-1 sm:mb-0">
                <span className="font-semibold text-gray-900 text-xs">Αριθμός Απόδειξης: </span>
                <span className="text-gray-600 text-xs">{receipt.receiptNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900 text-xs">Έκδοση: </span>
                <span className="text-gray-600 text-xs">{format(new Date(receipt.date), 'dd/MM/yyyy')}</span>
              </div>
            </div>
            <div className="flex justify-between py-0.5 sm:py-1 border-b border-gray-200">
              <span className="font-semibold text-gray-900 text-xs">Πελάτης:</span>
              <span className="text-gray-600 text-xs">{receipt.customerName}</span>
            </div>
            {receipt.customerVat && (
              <div className="flex justify-between py-0.5 sm:py-1 border-b border-gray-200">
                <span className="font-semibold text-gray-900 text-xs">ΑΦΜ:</span>
                <span className="text-gray-600 text-xs">{receipt.customerVat}</span>
              </div>
            )}
            {(receipt.startDate || receipt.endDate) && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-0.5 sm:py-1 border-b border-gray-200">
                {receipt.startDate && (
                  <div className="mb-1 sm:mb-0">
                    <span className="font-semibold text-gray-900 text-xs">Έναρξης: </span>
                    <span className="text-gray-600 text-xs">{format(new Date(receipt.startDate), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                {receipt.endDate && (
                  <div>
                    <span className="font-semibold text-gray-900 text-xs">Λήξης: </span>
                    <span className="text-gray-600 text-xs">{format(new Date(receipt.endDate), 'dd/MM/yyyy')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-2 sm:mb-3">
            <h3 className="font-semibold text-gray-900 mb-1 text-xs">Στοιχεία Συνδρομής</h3>
            {receipt.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 p-1 sm:p-2 mb-0.5 sm:mb-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-0.5 sm:mb-1">
                  <span className="font-medium text-gray-900 text-xs mb-1 sm:mb-0">{item.description}</span>
                  <span className="text-gray-600 text-xs">Ποσότητα: {item.quantity}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Τιμή μονάδας: €{item.unitPrice.toFixed(2)}</span>
                  <span>ΦΠΑ: {item.vatRate}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-1 sm:p-2 border-l-4 border-[#00ffba]">
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex justify-between py-0.5 sm:py-1">
                <span className="font-semibold text-gray-900 text-xs">Αξία Συνδρομής:</span>
                <span className="text-gray-600 text-xs">€{receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-0.5 sm:py-1">
                <span className="font-semibold text-gray-900 text-xs">ΦΠΑ (13%):</span>
                <span className="text-gray-600 text-xs">€{receipt.vat.toFixed(2)}</span>
              </div>
              <div className="border-t border-[#00ffba] pt-0.5 sm:pt-1 mt-1 sm:mt-2">
                <div className="flex justify-between">
                  <span className="text-sm sm:text-lg font-bold text-[#00ffba]">Σύνολο:</span>
                  <span className="text-sm sm:text-lg font-bold text-[#00ffba]">€{receipt.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-200 text-xs text-gray-500">
            <p><strong>HYPERKIDS</strong> - Γυμναστήριο</p>
            <p>Τηλ: +30 2310 529104 | Email: info@hyperkids.gr</p>
            <p className="text-xs">Διεύθυνση: ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46 - ΘΕΣΣΑΛΟΝΙΚΗ 54627</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};