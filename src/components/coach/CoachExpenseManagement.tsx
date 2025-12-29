import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, Edit2, Trash2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Expense {
  id: string;
  expense_number: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_number?: string;
  category?: string;
  created_at: string;
  coach_id?: string;
}

interface CoachExpenseManagementProps {
  coachId: string;
}

const EXPENSE_CATEGORIES = [
  'Εξοπλισμός',
  'Ενοίκιο',
  'Λογαριασμοί',
  'Marketing',
  'Μισθοδοσία',
  'Ασφάλιση',
  'Εκπαίδευση',
  'Λογισμικό',
  'Άλλα'
];

export const CoachExpenseManagement: React.FC<CoachExpenseManagementProps> = ({ coachId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expense_date: new Date(),
    receipt_number: '',
    category: ''
  });

  useEffect(() => {
    if (coachId) {
      fetchExpenses();
    }
  }, [coachId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('coach_id', coachId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error("Αποτυχία φόρτωσης εξόδων");
    } finally {
      setLoading(false);
    }
  };

  const generateExpenseNumber = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('expense_number')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error generating expense number:', error);
      return 'ΕΞ-0001';
    }

    if (!data || data.length === 0) {
      return 'ΕΞ-0001';
    }

    const lastNumber = data[0].expense_number;
    const numberPart = parseInt(lastNumber.split('-')[1]) || 0;
    return `ΕΞ-${String(numberPart + 1).padStart(4, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      if (!formData.description || !formData.amount) {
        toast.error("Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία");
        return;
      }

      const expenseNumber = editingExpense ? editingExpense.expense_number : await generateExpenseNumber();

      const expenseData = {
        expense_number: expenseNumber,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expense_date: format(formData.expense_date, 'yyyy-MM-dd'),
        receipt_number: formData.receipt_number || null,
        category: formData.category || null,
        coach_id: coachId
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast.success("Το έξοδο ενημερώθηκε επιτυχώς");
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
        toast.success("Το έξοδο καταχωρήθηκε επιτυχώς");
      }

      resetForm();
      fetchExpenses();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error("Σφάλμα: " + error.message);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      expense_date: new Date(expense.expense_date),
      receipt_number: expense.receipt_number || '',
      category: expense.category || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete);

      if (error) throw error;
      toast.success("Το έξοδο διαγράφηκε επιτυχώς");
      fetchExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error("Σφάλμα: " + error.message);
    } finally {
      setExpenseToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      expense_date: new Date(),
      receipt_number: '',
      category: ''
    });
    setEditingExpense(null);
    setShowAddForm(false);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-gray-500">Φόρτωση εξόδων...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Έξοδα</h3>
          <p className="text-sm text-gray-500">Σύνολο: €{totalExpenses.toFixed(2)}</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          Νέο Έξοδο
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-base">
              {editingExpense ? 'Επεξεργασία Εξόδου' : 'Νέο Έξοδο'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Περιγραφή *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-none"
                  placeholder="Περιγραφή εξόδου"
                />
              </div>

              <div className="space-y-2">
                <Label>Ποσό *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="rounded-none"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Ημερομηνία</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start rounded-none">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.expense_date, 'dd/MM/yyyy', { locale: el })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-none">
                    <Calendar
                      mode="single"
                      selected={formData.expense_date}
                      onSelect={(date) => date && setFormData({ ...formData, expense_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Κατηγορία</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε κατηγορία" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="rounded-none">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Αριθμός Απόδειξης</Label>
                <Input
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  className="rounded-none"
                  placeholder="Αριθμός απόδειξης/τιμολογίου"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm} className="rounded-none">
                Ακύρωση
              </Button>
              <Button onClick={handleSubmit} className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black">
                {editingExpense ? 'Ενημέρωση' : 'Αποθήκευση'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <Card className="rounded-none">
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Δεν υπάρχουν καταχωρημένα έξοδα
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4">Αρ.</th>
                    <th className="text-left py-3 px-4">Ημερομηνία</th>
                    <th className="text-left py-3 px-4">Περιγραφή</th>
                    <th className="text-left py-3 px-4">Κατηγορία</th>
                    <th className="text-right py-3 px-4">Ποσό</th>
                    <th className="text-center py-3 px-4">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs">{expense.expense_number}</td>
                      <td className="py-3 px-4">{format(new Date(expense.expense_date), 'dd/MM/yyyy')}</td>
                      <td className="py-3 px-4">{expense.description}</td>
                      <td className="py-3 px-4">{expense.category || '-'}</td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">
                        €{Number(expense.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                            className="rounded-none h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExpenseToDelete(expense.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="rounded-none h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή Εξόδου</AlertDialogTitle>
            <AlertDialogDescription>
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το έξοδο; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
