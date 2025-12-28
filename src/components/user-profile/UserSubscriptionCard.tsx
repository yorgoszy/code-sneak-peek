import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RotateCcw, 
  Pause, 
  Play, 
  Edit2, 
  Trash2, 
  CreditCard, 
  Calendar, 
  Clock,
  MoreVertical,
  Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Subscription {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  is_paused: boolean;
  paused_days_remaining: number | null;
  is_paid: boolean;
  subscription_types: {
    id: string;
    name: string;
    price: number;
    duration_months: number;
  };
}

interface UserSubscriptionCardProps {
  subscription: Subscription;
  onRefresh: () => void;
  subscriptionTypes?: Array<{ id: string; name: string; price: number; duration_months: number }>;
  isAdmin?: boolean;
}

export const UserSubscriptionCard: React.FC<UserSubscriptionCardProps> = ({
  subscription,
  onRefresh,
  subscriptionTypes = [],
  isAdmin = false
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStartDate, setEditStartDate] = useState(subscription.start_date);
  const [editEndDate, setEditEndDate] = useState(subscription.end_date);
  const [editSubscriptionType, setEditSubscriptionType] = useState(subscription.subscription_types.id);

  // Calculate remaining days
  const calculateRemainingDays = () => {
    if (subscription.is_paused && subscription.paused_days_remaining) {
      return subscription.paused_days_remaining;
    }
    const today = new Date();
    const endDate = new Date(subscription.end_date);
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  };

  const remainingDays = calculateRemainingDays();

  const handlePause = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('pause_subscription', {
        subscription_id: subscription.id
      });

      if (error) throw error;

      toast.success('Η συνδρομή τέθηκε σε παύση');
      onRefresh();
    } catch (error: any) {
      toast.error('Σφάλμα: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('resume_subscription', {
        subscription_id: subscription.id
      });

      if (error) throw error;

      toast.success('Η συνδρομή συνεχίστηκε');
      onRefresh();
    } catch (error: any) {
      toast.error('Σφάλμα: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('renew_subscription', {
        original_subscription_id: subscription.id
      });

      if (error) throw error;

      toast.success('Η συνδρομή ανανεώθηκε επιτυχώς');
      onRefresh();
    } catch (error: any) {
      toast.error('Σφάλμα: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success('Η συνδρομή διαγράφηκε');
      setDeleteDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      toast.error('Σφάλμα: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          start_date: editStartDate,
          end_date: editEndDate,
          subscription_type_id: editSubscriptionType
        })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success('Η συνδρομή ενημερώθηκε');
      setEditDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      toast.error('Σφάλμα: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaymentStatus = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ is_paid: !subscription.is_paid })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success(subscription.is_paid ? 'Σημειώθηκε ως μη πληρωμένη' : 'Σημειώθηκε ως πληρωμένη');
      onRefresh();
    } catch (error: any) {
      toast.error('Σφάλμα: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (subscription.is_paused) {
      return <Badge variant="secondary" className="rounded-none bg-yellow-100 text-yellow-800">Σε Παύση</Badge>;
    }
    if (subscription.status === 'active') {
      return <Badge variant="secondary" className="rounded-none bg-green-100 text-green-800">Ενεργή</Badge>;
    }
    if (subscription.status === 'expired') {
      return <Badge variant="secondary" className="rounded-none bg-red-100 text-red-800">Ληγμένη</Badge>;
    }
    return <Badge variant="secondary" className="rounded-none">{subscription.status}</Badge>;
  };

  const getDaysColor = () => {
    if (subscription.is_paused) return 'text-yellow-600';
    if (remainingDays < 0) return 'text-red-600';
    if (remainingDays <= 7) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <>
      <Card className="rounded-none hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Icon and Info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="bg-[#00ffba]/10 p-2 rounded-full flex-shrink-0">
                <Crown className="w-5 h-5 text-[#00ffba]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-sm truncate">{subscription.subscription_types.name}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {format(new Date(subscription.start_date), 'dd/MM/yy')} - {format(new Date(subscription.end_date), 'dd/MM/yy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Center - Status and Days */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {getStatusBadge()}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className={`font-bold text-lg ${getDaysColor()}`}>
                  {subscription.is_paused ? subscription.paused_days_remaining : remainingDays}
                </span>
                <span className="text-xs text-gray-500">ημέρες</span>
              </div>
              {!subscription.is_paid && (
                <Badge variant="destructive" className="rounded-none">Μη Πληρωμένη</Badge>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
              {/* Desktop buttons */}
              <div className="hidden md:flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRenew}
                  disabled={loading}
                  className="rounded-none"
                  title="Ανανέωση"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                {subscription.is_paused ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResume}
                    disabled={loading}
                    className="rounded-none"
                    title="Συνέχιση"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePause}
                    disabled={loading}
                    className="rounded-none"
                    title="Παύση"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  disabled={loading}
                  className="rounded-none"
                  title="Επεξεργασία"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                  className="rounded-none text-red-600 hover:text-red-700"
                  title="Διαγραφή"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <Button
                  variant={subscription.is_paid ? "outline" : "destructive"}
                  size="sm"
                  onClick={handleTogglePaymentStatus}
                  disabled={loading}
                  className="rounded-none"
                  title={subscription.is_paid ? "Σημείωση ως μη πληρωμένη" : "Σημείωση ως πληρωμένη"}
                >
                  <CreditCard className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile dropdown */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-none">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none">
                    <DropdownMenuItem onClick={handleRenew}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Ανανέωση
                    </DropdownMenuItem>
                    {subscription.is_paused ? (
                      <DropdownMenuItem onClick={handleResume}>
                        <Play className="w-4 h-4 mr-2" />
                        Συνέχιση
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={handlePause}>
                        <Pause className="w-4 h-4 mr-2" />
                        Παύση
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Επεξεργασία
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleTogglePaymentStatus}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {subscription.is_paid ? "Μη πληρωμένη" : "Πληρωμένη"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Διαγραφή
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Η συνδρομή θα διαγραφεί οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90 rounded-none"
              disabled={loading}
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Επεξεργασία Συνδρομής</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Τύπος Συνδρομής</Label>
              <Select value={editSubscriptionType} onValueChange={setEditSubscriptionType}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {subscriptionTypes.map(type => (
                    <SelectItem key={type.id} value={type.id} className="rounded-none">
                      {type.name} - €{type.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ημερομηνία Έναρξης</Label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Ημερομηνία Λήξης</Label>
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-none">
              Ακύρωση
            </Button>
            <Button onClick={handleEdit} disabled={loading} className="rounded-none">
              Αποθήκευση
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
