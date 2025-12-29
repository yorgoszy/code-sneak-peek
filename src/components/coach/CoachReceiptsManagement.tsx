import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { matchesSearchTerm } from "@/lib/utils";

interface Receipt {
  id: string;
  receipt_number: string;
  amount: number;
  receipt_type: string;
  notes: string | null;
  created_at: string;
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
}

export const CoachReceiptsManagement: React.FC<CoachReceiptsManagementProps> = ({ coachId }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (coachId) {
      fetchReceipts();
      fetchSubscriptionTypes();
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
      case 'subscription': return 'Νέα Συνδρομή';
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
                    </div>
                    <span className="font-medium text-[#00ffba] text-sm whitespace-nowrap">
                      €{Number(receipt.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-2">Αρ.</th>
                      <th className="text-left py-2 px-2">Ημ/νία</th>
                      <th className="text-left py-2 px-2">Αθλητής</th>
                      <th className="text-left py-2 px-2">Τύπος</th>
                      <th className="text-left py-2 px-2">Κατηγορία</th>
                      <th className="text-right py-2 px-2">Ποσό</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((receipt) => (
                      <tr key={receipt.id} className="border-t hover:bg-gray-50">
                        <td className="py-2 px-2 font-mono text-[10px]">{receipt.receipt_number}</td>
                        <td className="py-2 px-2">
                          {format(new Date(receipt.created_at), 'dd/MM/yy')}
                        </td>
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
                        <td className="py-2 px-2">{receipt.subscription_types?.name || '-'}</td>
                        <td className="py-2 px-2">
                          <span className="text-[10px] px-1 bg-blue-100 text-blue-700">
                            {getReceiptTypeLabel(receipt.receipt_type)}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-[#00ffba]">
                          €{Number(receipt.amount).toFixed(2)}
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
    </div>
  );
};
