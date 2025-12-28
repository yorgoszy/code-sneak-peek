import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { matchesSearchTerm } from "@/lib/utils";
import { Search, Calendar, Clock, Archive, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HistoricalSubscription {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  archived_at?: string;
  subscription_types: {
    name: string;
    price: number;
    duration_months: number;
  };
  app_users: {
    name: string;
    email: string;
  };
}

export const SubscriptionHistory: React.FC = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [historicalSubscriptions, setHistoricalSubscriptions] = useState<HistoricalSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading historical subscription data...');
      
      const { data: historicalSubs, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_types (name, price, duration_months),
          app_users!user_subscriptions_user_id_fkey (name, email)
        `)
        .eq('status', 'expired')
        .order('archived_at', { ascending: false, nullsFirst: false })
        .order('end_date', { ascending: false });

      if (error) {
        console.error('Error loading historical subscriptions:', error);
        throw error;
      }
      
      console.log('✅ Historical subscriptions loaded:', historicalSubs?.length);
      setHistoricalSubscriptions((historicalSubs || []) as HistoricalSubscription[]);

    } catch (error) {
      console.error('❌ Error loading historical data:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη φόρτωση των ιστορικών δεδομένων"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η συνδρομή διαγράφηκε οριστικά"
      });

      await loadHistoricalData();
    } catch (error) {
      console.error('Error permanently deleting subscription:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά την οριστική διαγραφή"
      });
    }
  };

  const filteredSubscriptions = historicalSubscriptions.filter(subscription =>
    matchesSearchTerm(subscription.app_users?.name || '', searchTerm) ||
    matchesSearchTerm(subscription.app_users?.email || '', searchTerm) ||
    matchesSearchTerm(subscription.subscription_types?.name || '', searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysExpiredText = (endDate: string) => {
    const today = new Date();
    const expiredDate = new Date(endDate);
    const daysExpired = Math.floor((today.getTime() - expiredDate.getTime()) / (1000 * 3600 * 24));
    
    if (daysExpired === 0) return 'Έληξε σήμερα';
    if (daysExpired === 1) return 'Έληξε χθες';
    return `Έληξε πριν ${daysExpired} ημέρες`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-600">Φόρτωση ιστορικών συνδρομών...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'}`}>
        <div>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>Ιστορικό Συνδρομών</h2>
          <p className="text-sm text-gray-600">
            Συνδρομές που έχουν λήξει και αρχειοθετηθεί
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="rounded-none">
            <Archive className="w-4 h-4 mr-1" />
            {historicalSubscriptions.length} Αρχειοθετημένες
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Αναζήτηση στο ιστορικό (όνομα, email, τύπος συνδρομής)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-none"
        />
      </div>

      {filteredSubscriptions.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center">
            <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Δεν βρέθηκαν ιστορικές συνδρομές
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Δοκιμάστε διαφορετικούς όρους αναζήτησης' : 'Δεν υπάρχουν αρχειοθετημένες συνδρομές'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          {!isMobile && (
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Αρχειοθετημένες Συνδρομές ({filteredSubscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Χρήστης</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Συνδρομή</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Περίοδος</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Κατάσταση</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Αρχειοθέτηση</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Ενέργειες</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscriptions.map((subscription) => (
                        <tr key={subscription.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {subscription.app_users?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {subscription.app_users?.email}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {subscription.subscription_types?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                €{subscription.subscription_types?.price} / {subscription.subscription_types?.duration_months} μήνες
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="flex items-center text-gray-600 mb-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                {format(new Date(subscription.start_date), 'dd/MM/yyyy', { locale: el })}
                              </div>
                              <div className="flex items-center text-red-600">
                                <Clock className="h-4 w-4 mr-1" />
                                {format(new Date(subscription.end_date), 'dd/MM/yyyy', { locale: el })}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {getDaysExpiredText(subscription.end_date)}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              className={`rounded-none ${getStatusColor(subscription.status)}`}
                            >
                              Έληξε
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {subscription.archived_at ? (
                              <div>
                                <p>{format(new Date(subscription.archived_at), 'dd/MM/yyyy', { locale: el })}</p>
                                <p className="text-xs">{format(new Date(subscription.archived_at), 'HH:mm', { locale: el })}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">Αυτόματη</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-none"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Διαγραφή
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-none">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Οριστική Διαγραφή Συνδρομής</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Είστε σίγουροι ότι θέλετε να διαγράψετε οριστικά αυτή τη συνδρομή;
                                    Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handlePermanentDelete(subscription.id)}
                                    className="bg-red-600 hover:bg-red-700 rounded-none"
                                  >
                                    Διαγραφή
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile Card View */}
          {isMobile && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Archive className="h-4 w-4" />
                <span className="text-sm font-medium">Αρχειοθετημένες Συνδρομές ({filteredSubscriptions.length})</span>
              </div>
              
              {filteredSubscriptions.map((subscription) => (
                <Card key={subscription.id} className="rounded-none">
                  <CardContent className="p-4">
                    {/* Header with User Info */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {subscription.app_users?.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {subscription.app_users?.email}
                        </p>
                      </div>
                      <Badge 
                        className={`rounded-none ml-2 ${getStatusColor(subscription.status)}`}
                      >
                        Έληξε
                      </Badge>
                    </div>

                    {/* Subscription Info */}
                    <div className="space-y-2 mb-3">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {subscription.subscription_types?.name}
                        </span>
                        <p className="text-sm text-gray-600">
                          €{subscription.subscription_types?.price} / {subscription.subscription_types?.duration_months} μήνες
                        </p>
                      </div>
                      
                      {/* Dates */}
                      <div className="text-sm space-y-1">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Έναρξη: {format(new Date(subscription.start_date), 'dd/MM/yyyy', { locale: el })}</span>
                        </div>
                        <div className="flex items-center text-red-600">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Λήξη: {format(new Date(subscription.end_date), 'dd/MM/yyyy', { locale: el })}</span>
                        </div>
                        <p className="text-xs text-gray-500 ml-4">
                          {getDaysExpiredText(subscription.end_date)}
                        </p>
                      </div>

                      {/* Archive Info */}
                      {subscription.archived_at && (
                        <div className="text-xs text-gray-500">
                          <span>Αρχειοθετήθηκε: {format(new Date(subscription.archived_at), 'dd/MM/yyyy HH:mm', { locale: el })}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-none w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Οριστική Διαγραφή
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none max-w-[95vw]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Οριστική Διαγραφή Συνδρομής</AlertDialogTitle>
                            <AlertDialogDescription>
                              Είστε σίγουροι ότι θέλετε να διαγράψετε οριστικά αυτή τη συνδρομή;
                              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col gap-2">
                            <AlertDialogAction 
                              onClick={() => handlePermanentDelete(subscription.id)}
                              className="bg-red-600 hover:bg-red-700 rounded-none w-full"
                            >
                              Διαγραφή
                            </AlertDialogAction>
                            <AlertDialogCancel className="rounded-none w-full">Ακύρωση</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};