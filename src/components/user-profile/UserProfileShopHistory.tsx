import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isValid } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar, MapPin, Clock, ShoppingBag, Euro } from "lucide-react";

interface PurchaseHistory {
  id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  subscription_type: {
    id: string;
    name: string;
    price: number;
    subscription_mode: string;
    duration_months: number;
    visit_count?: number;
  };
  status: string;
  is_paid: boolean;
}

interface UserProfileShopHistoryProps {
  userProfile: any;
}

export const UserProfileShopHistory: React.FC<UserProfileShopHistoryProps> = ({ userProfile }) => {
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedHistory, setGroupedHistory] = useState<{[key: string]: PurchaseHistory[]}>({});

  useEffect(() => {
    fetchPurchaseHistory();
  }, [userProfile.id]);

  const fetchPurchaseHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          start_date,
          end_date,
          created_at,
          status,
          is_paid,
          subscription_types (
            id,
            name,
            price,
            subscription_mode,
            duration_months,
            visit_count
          )
        `)
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedHistory = (data || []).map(item => ({
        ...item,
        subscription_type: item.subscription_types
      })) as PurchaseHistory[];
      setHistory(typedHistory);

      // Ομαδοποίηση ανά μήνα και έτος
      const grouped = typedHistory.reduce((acc, purchase) => {
        const date = parseISO(purchase.created_at);
        if (!isValid(date)) return acc;
        
        const monthYear = format(date, 'MMMM yyyy', { locale: el });
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(purchase);
        return acc;
      }, {} as {[key: string]: PurchaseHistory[]});

      setGroupedHistory(grouped);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, isPaid: boolean) => {
    if (!isPaid) return 'bg-red-100 text-red-800 border-red-200';
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = (status: string, isPaid: boolean) => {
    if (!isPaid) return 'Μη Πληρωμένο';
    switch (status) {
      case 'active': return 'Ενεργή';
      case 'expired': return 'Ληγμένη';
      case 'paused': return 'Σε Παύση';
      default: return status;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'visit_based': return <MapPin className="w-4 h-4" />;
      case 'videocall': return <Calendar className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getModeText = (mode: string) => {
    switch (mode) {
      case 'visit_based': return 'Επισκέψεις';
      case 'videocall': return 'Video Call';
      default: return 'Χρονική';
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φορτώνω το ιστορικό...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-8 text-center text-gray-500">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">Δεν υπάρχει ιστορικό αγορών</h3>
          <p>Δεν έχετε κάνει ακόμη καμία αγορά.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ιστορικό Αγορών</h2>
        <p className="text-gray-600">Όλες οι αγορές σας ανά μήνα και έτος</p>
      </div>

      {Object.entries(groupedHistory).map(([monthYear, purchases]) => (
        <Card key={monthYear} className="rounded-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-[#00ffba]" />
              {monthYear}
              <Badge variant="secondary" className="ml-auto rounded-none">
                {purchases.length} αγορές
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div 
                  key={purchase.id} 
                  className="border border-gray-200 rounded-none p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getModeIcon(purchase.subscription_type.subscription_mode)}
                        <h4 className="font-medium text-gray-900">
                          {purchase.subscription_type.name}
                        </h4>
                        <Badge 
                          className={`rounded-none border ${getStatusColor(purchase.status, purchase.is_paid)}`}
                          variant="outline"
                        >
                          {getStatusText(purchase.status, purchase.is_paid)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Τύπος: {getModeText(purchase.subscription_type.subscription_mode)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-bold text-[#00ffba]">
                        <Euro className="w-4 h-4" />
                        {purchase.subscription_type.price}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Ημερομηνία Αγοράς</p>
                      <p className="font-medium">
                        {format(parseISO(purchase.created_at), 'dd/MM/yyyy', { locale: el })}
                      </p>
                    </div>
                    {purchase.subscription_type.subscription_mode === 'time_based' && (
                      <>
                        <div>
                          <p className="text-gray-500">Έναρξη</p>
                          <p className="font-medium">
                            {format(parseISO(purchase.start_date), 'dd/MM/yyyy', { locale: el })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Λήξη</p>
                          <p className="font-medium">
                            {format(parseISO(purchase.end_date), 'dd/MM/yyyy', { locale: el })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Διάρκεια</p>
                          <p className="font-medium">
                            {purchase.subscription_type.duration_months} μήνες
                          </p>
                        </div>
                      </>
                    )}
                    {purchase.subscription_type.subscription_mode === 'visit_based' && (
                      <div>
                        <p className="text-gray-500">Επισκέψεις</p>
                        <p className="font-medium">
                          {purchase.subscription_type.visit_count}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Σύνοψη */}
      <Card className="rounded-none bg-gray-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-[#00ffba]">{history.length}</p>
              <p className="text-sm text-gray-600">Συνολικές Αγορές</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                €{history.reduce((sum, p) => sum + p.subscription_type.price, 0)}
              </p>
              <p className="text-sm text-gray-600">Συνολικό Ποσό</p>
            </div>
            <div className="md:col-span-1 col-span-2">
              <p className="text-2xl font-bold text-blue-600">
                {history.filter(p => p.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Ενεργές Συνδρομές</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};