import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, Eye, Printer, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { matchesSearchTerm } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Receipt {
  id: string;
  receipt_number: string;
  amount: number;
  receipt_type: string;
  notes: string | null;
  created_at: string;
  mark?: string | null;
  coach_users?: {
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  subscription_types?: {
    id: string;
    name: string;
  } | null;
}

interface SubscriptionType {
  id: string;
  name: string;
}

interface CoachReceiptsManagementProps {
  coachId: string;
  onDataChange?: () => void;
}

interface CoachProfileData {
  business_name: string | null;
  logo_url: string | null;
  vat_number: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
}

export const CoachReceiptsManagement: React.FC<CoachReceiptsManagementProps> = ({ coachId, onDataChange }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [markValue, setMarkValue] = useState('');
  const [coachProfile, setCoachProfile] = useState<CoachProfileData | null>(null);

  useEffect(() => {
    if (coachId) {
      fetchReceipts();
      fetchSubscriptionTypes();
      fetchCoachProfile();
    }
  }, [coachId]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coach_receipts')
        .select(`
          *,
          coach_users (name, email, avatar_url),
          subscription_types (id, name)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error("Αποτυχία φόρτωσης αποδείξεων");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name')
        .eq('coach_id', coachId);

      if (error) throw error;
      setSubscriptionTypes(data || []);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
    }
  };

  const fetchCoachProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('business_name, logo_url, vat_number, address, city, phone')
        .eq('coach_id', coachId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCoachProfile(data);
    } catch (error) {
      console.error('Error fetching coach profile:', error);
    }
  };

  const handleDelete = async () => {
    if (!receiptToDelete) return;

    try {
      const { error } = await supabase
        .from('coach_receipts')
        .delete()
        .eq('id', receiptToDelete);

      if (error) throw error;
      toast.success("Διαγράφηκε");
      fetchReceipts();
      onDataChange?.();
    } catch (error: any) {
      console.error('Error deleting receipt:', error);
      toast.error("Σφάλμα: " + error.message);
    } finally {
      setReceiptToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSaveMark = async (receiptId: string) => {
    try {
      const { error } = await supabase
        .from('coach_receipts')
        .update({ mark: markValue || null })
        .eq('id', receiptId);

      if (error) throw error;
      toast.success("ΜΑΡΚ αποθηκεύτηκε");
      setEditingMarkId(null);
      setMarkValue('');
      fetchReceipts();
    } catch (error: any) {
      console.error('Error saving mark:', error);
      toast.error("Σφάλμα: " + error.message);
    }
  };

  const handleCancelMark = () => {
    setEditingMarkId(null);
    setMarkValue('');
  };

  const handleStartEditMark = (receipt: Receipt) => {
    setEditingMarkId(receipt.id);
    setMarkValue(receipt.mark || '');
  };

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setViewDialogOpen(true);
  };

  const handlePrint = async (receipt: Receipt) => {
    // Create a temporary container for the receipt - A5 size (148mm x 210mm), compact
    const container = document.createElement('div');
    container.id = 'receipt-print-container';
    container.style.cssText = 'position: fixed; top: -9999px; left: -9999px; width: 280px; background: white; padding: 16px; font-family: Arial, sans-serif;';
    
    container.innerHTML = `
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        Απόδειξη ${receipt.receipt_number}
      </div>
      
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        ${receipt.coach_users?.avatar_url 
          ? `<img src="${receipt.coach_users.avatar_url}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" crossorigin="anonymous" />`
          : `<div style="width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${receipt.coach_users?.name?.charAt(0) || 'Α'}</div>`
        }
        <div>
          <div style="font-weight: 600; font-size: 12px;">${receipt.coach_users?.name || '-'}</div>
          <div style="font-size: 10px; color: #6b7280;">${receipt.coach_users?.email || ''}</div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; font-size: 10px;">
        <div>
          <div style="color: #6b7280;">Ημερομηνία:</div>
          <div style="font-weight: 500;">${format(new Date(receipt.created_at), 'dd/MM/yyyy', { locale: el })}</div>
        </div>
        <div>
          <div style="color: #6b7280;">Τύπος:</div>
          <div style="font-weight: 500;">${receipt.subscription_types?.name || '-'}</div>
        </div>
        <div>
          <div style="color: #6b7280;">Είδος:</div>
          <div style="font-weight: 500;">${getReceiptTypeLabel(receipt.receipt_type)}</div>
        </div>
        ${receipt.mark ? `
        <div>
          <div style="color: #6b7280;">ΜΑΡΚ ΑΑΔΕ:</div>
          <div style="font-weight: 500;">${receipt.mark}</div>
        </div>
        ` : ''}
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-bottom: 12px;">
        <div style="color: #6b7280; font-size: 10px;">Ποσό:</div>
        <div style="font-size: 20px; font-weight: bold; color: #00a86b;">€${Number(receipt.amount).toFixed(2)}</div>
      </div>
      
      ${coachProfile && (coachProfile.business_name || coachProfile.logo_url) ? `
      <div style="border-top: 1px solid #e5e7eb; padding-top: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${coachProfile.logo_url ? `<img src="${coachProfile.logo_url}" style="max-width: 40px; max-height: 40px; object-fit: contain;" crossorigin="anonymous" />` : ''}
          <div>
            ${coachProfile.business_name ? `<div style="font-size: 11px; font-weight: 600;">${coachProfile.business_name}</div>` : ''}
            <div style="font-size: 9px; color: #6b7280;">
              ${coachProfile.address ? coachProfile.address : ''}${coachProfile.city ? `, ${coachProfile.city}` : ''}
            </div>
            <div style="font-size: 9px; color: #6b7280;">
              ${coachProfile.vat_number ? `ΑΦΜ: ${coachProfile.vat_number}` : ''}${coachProfile.phone ? ` | Τηλ: ${coachProfile.phone}` : ''}
            </div>
          </div>
        </div>
      </div>
      ` : ''}
    `;
    
    document.body.appendChild(container);
    
    try {
      // Wait for images to load
      const images = container.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          }
        });
      }));
      
      // Use html2canvas to create image
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Open print window with the image - A5 portrait
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Απόδειξη ${receipt.receipt_number}</title>
              <style>
                @page {
                  size: 148mm 210mm;
                  margin: 10mm;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                html, body {
                  width: 148mm;
                  height: 210mm;
                  margin: 0;
                  padding: 10mm;
                  display: flex;
                  justify-content: center;
                  align-items: flex-start;
                }
                img { 
                  max-width: 128mm;
                  height: auto;
                }
                @media print {
                  html, body {
                    width: 148mm;
                    height: 210mm;
                  }
                }
              </style>
            </head>
            <body>
              <img src="${canvas.toDataURL('image/png')}" />
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
    } catch (error) {
      console.error('Error generating receipt image:', error);
      toast.error('Σφάλμα κατά την εκτύπωση');
    } finally {
      document.body.removeChild(container);
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const userName = receipt.coach_users?.name || '';
    const userEmail = receipt.coach_users?.email || '';
    const matchesSearch = matchesSearchTerm(userName, searchTerm) || matchesSearchTerm(userEmail, searchTerm);
    const matchesType = filterType === 'all' || receipt.subscription_types?.id === filterType;
    return matchesSearch && matchesType;
  });

  const totalIncome = filteredReceipts.reduce((sum, r) => sum + Number(r.amount), 0);

  const getReceiptTypeLabel = (type: string) => {
    switch (type) {
      case 'subscription': return 'Νέα';
      case 'renewal': return 'Ανανέωση';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <span className="text-gray-500 text-sm">Φόρτωση...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - Compact */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold truncate">Έσοδα</h3>
          <p className="text-xs text-gray-500">Σύνολο: €{totalIncome.toFixed(2)}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Αναζήτηση αθλητή..."
            className="rounded-none h-8 text-xs pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="rounded-none h-8 text-xs w-full sm:w-40">
            <SelectValue placeholder="Τύπος συνδρομής" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all" className="text-xs">Όλοι οι τύποι</SelectItem>
            {subscriptionTypes.map(type => (
              <SelectItem key={type.id} value={type.id} className="text-xs">{type.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Receipts List */}
      <Card className="rounded-none">
        <CardContent className="p-0">
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              Δεν υπάρχουν αποδείξεις
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="sm:hidden divide-y">
                {filteredReceipts.map((receipt) => (
                  <div key={receipt.id} className="p-2 flex items-center gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={receipt.coach_users?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {receipt.coach_users?.name?.charAt(0) || 'Α'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-400">{receipt.receipt_number}</span>
                        <span className="text-[10px] text-gray-400">
                          {format(new Date(receipt.created_at), 'dd/MM/yy')}
                        </span>
                      </div>
                      <p className="text-sm truncate">{receipt.coach_users?.name || '-'}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">
                          {receipt.subscription_types?.name || '-'}
                        </span>
                        <span className="text-[10px] px-1 bg-blue-100 text-blue-700">
                          {getReceiptTypeLabel(receipt.receipt_type)}
                        </span>
                      </div>
                      {receipt.mark && (
                        <span className="text-[10px] text-gray-400">ΜΑΡΚ: {receipt.mark}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-medium text-[#00ffba] text-sm whitespace-nowrap">
                        €{Number(receipt.amount).toFixed(2)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(receipt)}
                          className="rounded-none h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReceiptToDelete(receipt.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="rounded-none h-6 w-6 p-0 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-2">Αριθμός</th>
                      <th className="text-left py-2 px-2">Αθλητής</th>
                      <th className="text-left py-2 px-2">Ημερομηνία</th>
                      <th className="text-left py-2 px-2">Τύπος</th>
                      <th className="text-right py-2 px-2">Ποσό</th>
                      <th className="text-left py-2 px-2">ΜΑΡΚ</th>
                      <th className="text-center py-2 px-2">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((receipt) => (
                      <tr key={receipt.id} className="border-t hover:bg-gray-50">
                        <td className="py-2 px-2 font-mono text-[10px]">{receipt.receipt_number}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={receipt.coach_users?.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {receipt.coach_users?.name?.charAt(0) || 'Α'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-24">{receipt.coach_users?.name || '-'}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          {format(new Date(receipt.created_at), 'dd/MM/yy')}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex flex-col">
                            <span>{receipt.subscription_types?.name || '-'}</span>
                            <span className="text-[10px] px-1 bg-blue-100 text-blue-700 inline-block w-fit">
                              {getReceiptTypeLabel(receipt.receipt_type)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-[#00ffba]">
                          €{Number(receipt.amount).toFixed(2)}
                        </td>
                        <td className="py-2 px-2">
                          {editingMarkId === receipt.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={markValue}
                                onChange={(e) => setMarkValue(e.target.value)}
                                className="rounded-none h-6 text-[10px] w-24"
                                placeholder="ΜΑΡΚ ΑΑΔΕ"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveMark(receipt.id)}
                                className="rounded-none h-6 w-6 p-0 text-green-600"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelMark}
                                className="rounded-none h-6 w-6 p-0 text-gray-400"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditMark(receipt)}
                              className="text-left hover:bg-gray-100 px-1 py-0.5 min-w-16 text-[10px]"
                            >
                              {receipt.mark || <span className="text-gray-400 italic">+ Προσθήκη</span>}
                            </button>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(receipt)}
                              className="rounded-none h-6 w-6 p-0"
                              title="Προβολή"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrint(receipt)}
                              className="rounded-none h-6 w-6 p-0"
                              title="Εκτύπωση"
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReceiptToDelete(receipt.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="rounded-none h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              title="Διαγραφή"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle>Απόδειξη {selectedReceipt?.receipt_number}</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4 text-sm">
              {/* Athlete Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedReceipt.coach_users?.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedReceipt.coach_users?.name?.charAt(0) || 'Α'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedReceipt.coach_users?.name || '-'}</p>
                  <p className="text-xs text-gray-500">{selectedReceipt.coach_users?.email || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Ημερομηνία:</span>
                  <p>{format(new Date(selectedReceipt.created_at), 'dd/MM/yyyy', { locale: el })}</p>
                </div>
                <div>
                  <span className="text-gray-500">Τύπος:</span>
                  <p>{selectedReceipt.subscription_types?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Είδος:</span>
                  <p>{getReceiptTypeLabel(selectedReceipt.receipt_type)}</p>
                </div>
                <div>
                  <span className="text-gray-500">ΜΑΡΚ ΑΑΔΕ:</span>
                  <p>{selectedReceipt.mark || '-'}</p>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <span className="text-gray-500 text-xs">Ποσό:</span>
                <p className="text-xl font-bold text-[#00ffba]">€{Number(selectedReceipt.amount).toFixed(2)}</p>
              </div>

              {/* Coach Business Info */}
              {coachProfile && (coachProfile.business_name || coachProfile.logo_url) && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-3">
                    {coachProfile.logo_url && (
                      <img 
                        src={coachProfile.logo_url} 
                        alt="Logo" 
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      {coachProfile.business_name && (
                        <p className="font-medium text-xs">{coachProfile.business_name}</p>
                      )}
                      <div className="text-[10px] text-gray-500">
                        {coachProfile.address && <span>{coachProfile.address}</span>}
                        {coachProfile.city && <span>, {coachProfile.city}</span>}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {coachProfile.vat_number && <span>ΑΦΜ: {coachProfile.vat_number}</span>}
                        {coachProfile.phone && <span> | Τηλ: {coachProfile.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handlePrint(selectedReceipt)}
                  className="rounded-none flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Εκτύπωση
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
