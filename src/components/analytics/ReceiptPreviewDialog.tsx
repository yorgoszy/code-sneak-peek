import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { format } from "date-fns";
import { generateReceiptPDF, downloadPDFFromBase64 } from "@/utils/pdfGenerator";
import { QRCodeSVG } from 'qrcode.react';

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
  invoiceMark?: string;
  invoiceUid?: string;
  qrUrl?: string;
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

    const pdfBase64 = await generateReceiptPDF('receipt-content');
    if (pdfBase64) {
      downloadPDFFromBase64(pdfBase64, `${receipt.receiptNumber}.pdf`);
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
    <Dialog open={isOpen}>
      <DialogContent className="max-w-5xl rounded-none sm:rounded-none w-full h-full sm:h-auto sm:w-auto overflow-y-auto sm:overflow-visible [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm sm:text-base">Προεπισκόπηση Απόδειξης</DialogTitle>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={downloadPDF}
                className="bg-black hover:bg-black/90 text-white rounded-none text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                size="sm"
                title="Κατέβασμα PDF"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="rounded-none text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                title="Κλείσιμο"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div id="receipt-content" className="bg-white p-2 mx-auto max-w-4xl border border-black text-xs">
          {/* Header with business details */}
          <div className="flex items-start justify-between border-b border-black pb-1 mb-2">
            <div className="flex-1">
              <div className="text-[11px] text-black space-y-0 text-left leading-tight">
                <p><strong>HYPERKIDS</strong> — <strong>ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ</strong></p>
                <p>ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46, ΘΕΣΣΑΛΟΝΙΚΗ 54627 · Τηλ: 2310 529104</p>
                <p>info@hyperkids.gr · www.hyperkids.gr</p>
              </div>
            </div>
          </div>

          {/* Receipt Title */}
          <h2 className="text-sm text-black text-center mb-1 font-bold tracking-wide">ΑΠΟΔΕΙΞΗ ΣΥΝΔΡΟΜΗΣ</h2>

          {/* Receipt Info */}
          <div className="mb-2">
            <div className="flex justify-between py-0.5 border-b border-gray-300">
              <div>
                <span className="font-semibold text-black text-xs">Αρ. Απόδειξης: </span>
                <span className="text-black text-xs">{receipt.receiptNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-black text-xs">Έκδοση: </span>
                <span className="text-black text-xs">{format(new Date(receipt.date), 'dd/MM/yyyy')}</span>
              </div>
            </div>
            <div className="flex justify-between py-0.5 border-b border-gray-300">
              <span className="font-semibold text-black text-xs">Πελάτης:</span>
              <span className="text-black text-xs">{receipt.customerName}</span>
            </div>
            {receipt.customerVat && (
              <div className="flex justify-between py-0.5 border-b border-gray-300">
                <span className="font-semibold text-black text-xs">ΑΦΜ:</span>
                <span className="text-black text-xs">{receipt.customerVat}</span>
              </div>
            )}
            {(receipt.startDate || receipt.endDate) && (
              <div className="flex justify-between py-0.5 border-b border-gray-300">
                {receipt.startDate && (
                  <div>
                    <span className="font-semibold text-black text-xs">Έναρξης: </span>
                    <span className="text-black text-xs">{format(new Date(receipt.startDate), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                {receipt.endDate && (
                  <div>
                    <span className="font-semibold text-black text-xs">Λήξης: </span>
                    <span className="text-black text-xs">{format(new Date(receipt.endDate), 'dd/MM/yyyy')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-2">
            <h3 className="font-semibold text-black mb-0.5 text-xs">Στοιχεία Συνδρομής</h3>
            {receipt.items?.map((item, index) => (
              <div key={item.id || index} className="border border-gray-400 p-1 mb-0.5">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-black text-xs">{item.description || '-'}</span>
                  <span className="text-black text-xs">Ποσ: {item.quantity ?? 1}</span>
                </div>
                <div className="flex justify-between text-xs text-black">
                  <span>Τιμή: €{(item.unitPrice ?? 0).toFixed(2)}</span>
                  <span>ΦΠΑ: {item.vatRate ?? 0}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border border-black p-1.5">
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-black text-xs">Αξία Συνδρομής:</span>
              <span className="text-black text-xs">€{(receipt.subtotal ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-black text-xs">ΦΠΑ (13%):</span>
              <span className="text-black text-xs">€{(receipt.vat ?? 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-black pt-0.5 mt-0.5 flex justify-between">
              <span className="text-sm font-bold text-black">Σύνολο:</span>
              <span className="text-sm font-bold text-black">€{(receipt.total ?? 0).toFixed(2)}</span>
            </div>
          </div>

          {/* MyData QR Code */}
          {receipt.qrUrl && receipt.myDataStatus === 'sent' && (
            <div className="mt-2 pt-1 border-t border-black">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-black mb-0.5">MyData ΑΑΔΕ</p>
                  <p className="text-xs text-black">ΜΑΡΚ: {receipt.invoiceMark}</p>
                  {receipt.invoiceUid && (
                    <p className="text-xs text-black">UID: {receipt.invoiceUid}</p>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <QRCodeSVG 
                    value={receipt.qrUrl} 
                    size={56} 
                    level="M"
                    className="border border-black p-0.5"
                  />
                  <p className="text-[10px] text-black mt-0.5">Σάρωση επαλήθευσης</p>
                </div>
              </div>
            </div>
          )}

          {/* Logo */}
          <div className="flex justify-center items-center mt-2 pt-1 border-t border-black">
            <div className="w-1/3 h-6">
              <img 
                src="/lovable-uploads/dce6f194-3bc2-4d61-9253-4f976bf25f5f.png" 
                alt="HYPERKIDS Logo" 
                className="w-full h-full object-contain filter grayscale brightness-0 opacity-60"
              />
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};