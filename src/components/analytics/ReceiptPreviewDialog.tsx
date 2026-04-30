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

        <div id="receipt-content" className="bg-white p-3 mx-auto max-w-4xl text-xs text-black">
          {/* Header */}
          <div className="text-left pb-2 mb-2 border-b border-black">
            <p className="text-base font-bold tracking-wide">HYPERKIDS</p>
            <p className="text-[11px] font-semibold">ΥΠΗΡΕΣΙΕΣ ΓΥΜΝΑΣΤΗΡΙΟΥ</p>
            <p className="text-[10px] mt-0.5">ΑΝΔΡΕΟΥ ΓΕΩΡΓΙΟΥ 46, ΘΕΣΣΑΛΟΝΙΚΗ 54627 · Τηλ: 2310 529104</p>
            <p className="text-[10px]">info@hyperkids.gr · www.hyperkids.gr</p>
          </div>

          {/* Receipt Title */}
          <h2 className="text-sm text-center mb-2 font-bold tracking-wide">ΑΠΟΔΕΙΞΗ ΣΥΝΔΡΟΜΗΣ</h2>

          {/* Receipt Info */}
          <div className="mb-2 space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span><strong>Αρ. Απόδειξης:</strong> {receipt.receiptNumber}</span>
              <span><strong>Έκδοση:</strong> {format(new Date(receipt.date), 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span><strong>Πελάτης:</strong> {receipt.customerName}</span>
              {receipt.customerVat && <span><strong>ΑΦΜ:</strong> {receipt.customerVat}</span>}
            </div>
            {(receipt.startDate || receipt.endDate) && (
              <div className="flex justify-between">
                {receipt.startDate && <span><strong>Έναρξη:</strong> {format(new Date(receipt.startDate), 'dd/MM/yyyy')}</span>}
                {receipt.endDate && <span><strong>Λήξη:</strong> {format(new Date(receipt.endDate), 'dd/MM/yyyy')}</span>}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-2 border-t border-b border-black py-1">
            {receipt.items?.map((item, index) => (
              <div key={item.id || index} className="flex justify-between text-xs py-0.5">
                <span className="flex-1">{item.description || '-'}</span>
                <span className="mx-2">Ποσ: {item.quantity ?? 1}</span>
                <span className="mx-2">€{(item.unitPrice ?? 0).toFixed(2)}</span>
                <span>ΦΠΑ {item.vatRate ?? 0}%</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span>Αξία Συνδρομής:</span>
              <span>€{(receipt.subtotal ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>ΦΠΑ (13%):</span>
              <span>€{(receipt.vat ?? 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-black pt-0.5 mt-0.5 flex justify-between font-bold text-sm">
              <span>Σύνολο:</span>
              <span>€{(receipt.total ?? 0).toFixed(2)}</span>
            </div>
          </div>

          {/* MyData QR Code */}
          {receipt.qrUrl && receipt.myDataStatus === 'sent' && (
            <div className="mt-2 pt-2 border-t border-black flex items-center justify-between">
              <div className="flex-1 text-[10px]">
                <p className="font-semibold mb-0.5">MyData ΑΑΔΕ</p>
                <p>ΜΑΡΚ: {receipt.invoiceMark}</p>
                {receipt.invoiceUid && <p>UID: {receipt.invoiceUid}</p>}
              </div>
              <div className="flex flex-col items-center">
                <QRCodeSVG value={receipt.qrUrl} size={56} level="M" />
                <p className="text-[9px] mt-0.5">Σάρωση επαλήθευσης</p>
              </div>
            </div>
          )}

          {/* Logo */}
          <div className="flex justify-center items-center mt-2 pt-2 border-t border-black">
            <div className="w-1/4 h-6">
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