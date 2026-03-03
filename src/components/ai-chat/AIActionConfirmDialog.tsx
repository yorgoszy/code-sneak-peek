import React from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Dumbbell, CreditCard, Calendar, Utensils, CalendarDays, Trash2, Play, Pause, RefreshCw, X, Clock, DollarSign, MapPin, FileCheck, UserCheck } from "lucide-react";

export interface AIAction {
  action: string;
  [key: string]: any;
}

interface AIActionConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: AIAction | null;
  isExecuting?: boolean;
}

const getActionInfo = (action: AIAction | null) => {
  if (!action) return { title: '', description: '', icon: Dumbbell, color: 'bg-gray-500' };
  
  switch (action.action) {
    case 'create_program':
      return {
        title: 'Δημιουργία Προγράμματος',
        description: `Πρόγραμμα "${action.name || '?'}" ${action.user_id ? `για ${action.user_id}` : ''} ${action.user_ids?.length ? `για ${action.user_ids.length} χρήστες` : ''} ${action.training_dates?.length ? `(${action.training_dates.length} ημέρες)` : ''}`,
        icon: Dumbbell,
        color: 'bg-[#00ffba]',
      };
    case 'create_nutrition_plan':
      return {
        title: 'Δημιουργία Διατροφής',
        description: `Πλάνο "${action.name || '?'}" ${action.target_user_id || action.user_id ? `για ${action.target_user_name || action.target_user_id || action.user_id}` : ''} (${action.totalCalories || action.total_calories || '?'} kcal)`,
        icon: Utensils,
        color: 'bg-green-500',
      };
    case 'create_annual_plan':
      return {
        title: 'Δημιουργία Ετήσιου Πλάνου',
        description: `Μακροκύκλος ${action.year || ''} ${action.user_id ? `για ${action.user_id}` : ''} ${action.user_ids?.length ? `για ${action.user_ids.length} χρήστες` : ''} (${action.phases?.length || 0} φάσεις)`,
        icon: CalendarDays,
        color: 'bg-purple-500',
      };
    case 'delete_annual_plan':
      return {
        title: 'Διαγραφή Ετήσιου Πλάνου',
        description: `Διαγραφή μακροκύκλου ${action.year || ''} ${action.user_id ? `για ${action.user_id}` : ''}`,
        icon: Trash2,
        color: 'bg-destructive',
      };
    case 'create_subscription':
      return {
        title: 'Δημιουργία Συνδρομής',
        description: `Νέα συνδρομή ${action.subscription_type_name || ''} ${action.user_id ? `για ${action.user_id}` : ''} ${action.start_date ? `(από ${action.start_date})` : ''}`,
        icon: CreditCard,
        color: 'bg-[#cb8954]',
      };
    case 'pause_subscription':
      return {
        title: 'Παύση Συνδρομής',
        description: `Παύση συνδρομής ${action.user_name ? `του ${action.user_name}` : ''}`,
        icon: Pause,
        color: 'bg-yellow-500',
      };
    case 'resume_subscription':
      return {
        title: 'Επαναφορά Συνδρομής',
        description: `Επαναφορά συνδρομής ${action.user_name ? `του ${action.user_name}` : ''}`,
        icon: Play,
        color: 'bg-green-500',
      };
    case 'renew_subscription':
      return {
        title: 'Ανανέωση Συνδρομής',
        description: `Ανανέωση συνδρομής ${action.user_name ? `του ${action.user_name}` : ''}`,
        icon: RefreshCw,
        color: 'bg-blue-500',
      };
    case 'create_booking':
      return {
        title: 'Νέα Κράτηση',
        description: `Κράτηση ${action.section_name || ''} - ${action.booking_date || ''} ${action.booking_time || ''} ${action.user_id ? `για ${action.user_id}` : ''}`,
        icon: Calendar,
        color: 'bg-blue-500',
      };
    case 'cancel_booking':
      return {
        title: 'Ακύρωση Κράτησης',
        description: `Ακύρωση κράτησης ${action.booking_id ? `#${action.booking_id.slice(0, 8)}` : ''}`,
        icon: X,
        color: 'bg-destructive',
      };
    case 'update_subscription_end_date':
      return {
        title: 'Αλλαγή Ημ. Λήξης',
        description: `Νέα ημ. λήξης: ${action.new_end_date || '?'} ${action.user_name ? `για ${action.user_name}` : ''}`,
        icon: Clock,
        color: 'bg-orange-500',
      };
    case 'toggle_payment':
      return {
        title: action.is_paid ? 'Σήμανση ως Πληρωμένη' : 'Σήμανση ως Απλήρωτη',
        description: `${action.user_name ? `Συνδρομή ${action.user_name}` : 'Συνδρομή'} → ${action.is_paid ? 'Πληρωμένη ✅' : 'Απλήρωτη ❌'}`,
        icon: DollarSign,
        color: action.is_paid ? 'bg-[#00ffba]' : 'bg-red-500',
      };
    case 'record_visit':
      return {
        title: 'Καταγραφή Επίσκεψης',
        description: `Παρουσία ${action.user_name || action.user_id || '?'} ${action.visit_type ? `(${action.visit_type})` : ''}`,
        icon: UserCheck,
        color: 'bg-[#00ffba]',
      };
    case 'update_user_section':
      return {
        title: 'Αλλαγή Τμήματος',
        description: `${action.user_name || action.user_id || '?'} → ${action.section_name || '?'}`,
        icon: MapPin,
        color: 'bg-blue-500',
      };
    case 'confirm_receipt_mark':
      return {
        title: 'Επιβεβαίωση Mark Απόδειξης',
        description: `Απόδειξη ${action.receipt_number ? `#${action.receipt_number}` : ''} → Mark: ${action.mark || 'confirmed'}`,
        icon: FileCheck,
        color: 'bg-[#cb8954]',
      };
    default:
      return {
        title: `Ενέργεια: ${action.action}`,
        description: JSON.stringify(action).slice(0, 200),
        icon: Dumbbell,
        color: 'bg-gray-500',
      };
  }
};

export const AIActionConfirmDialog: React.FC<AIActionConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  isExecuting = false,
}) => {
  const info = getActionInfo(action);
  const Icon = info.icon;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className={`w-8 h-8 ${info.color} rounded-full flex items-center justify-center text-white`}>
              <Icon className="w-4 h-4" />
            </div>
            {info.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            <p className="mb-2">{info.description}</p>
            <Badge variant="outline" className="rounded-none text-xs">
              Ο AI βοηθός θέλει να εκτελέσει αυτή την ενέργεια
            </Badge>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-none" disabled={isExecuting}>
            Ακύρωση
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            disabled={isExecuting}
          >
            {isExecuting ? 'Εκτέλεση...' : 'Επιβεβαίωση'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
