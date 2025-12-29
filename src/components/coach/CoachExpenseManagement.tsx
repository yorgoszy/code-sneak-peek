import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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
        toast.error("Συμπληρώστε τα υποχρεωτικά πεδία");
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
        toast.success("Ενημερώθηκε");
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
        toast.success("Καταχωρήθηκε");
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
      toast.success("Διαγράφηκε");
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
          <h3 className="text-sm sm:text-base font-semibold truncate">Έξοδα</h3>
          <p className="text-xs text-gray-500">Σύνολο: €{totalExpenses.toFixed(2)}</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          size="sm"
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-xs h-8 px-2 sm:px-3"
        >
          <Plus className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">Νέο</span>
        </Button>
      </div>

      {/* Add/Edit Form - Compact */}
      {showAddForm && (
        <Card className="rounded-none">
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="text-sm">
              {editingExpense ? 'Επεξεργασία' : 'Νέο Έξοδο'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0 space-y-2 sm:space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <Label className="text-xs">Περιγραφή *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-none h-8 text-sm"
                  placeholder="Περιγραφή"
                />
              </div>

              <div className="col-span-1 space-y-1">
                <Label className="text-xs">Ποσό *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="rounded-none h-8 text-sm"
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-1 space-y-1">
                <Label className="text-xs">Ημ/νία</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start rounded-none h-8 text-xs">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {format(formData.expense_date, 'dd/MM/yy', { locale: el })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-none">
                    <Calendar
                      mode="single"
                      selected={formData.expense_date}
                      onSelect={(date) => date && setFormData({ ...formData, expense_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-1 space-y-1">
                <Label className="text-xs">Κατηγορία</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="rounded-none h-8 text-xs">
                    <SelectValue placeholder="Επιλογή" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="rounded-none text-xs">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Αρ. Απόδειξης</Label>
                <Input
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  className="rounded-none h-8 text-sm"
                  placeholder="Αριθμός"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={resetForm} size="sm" className="rounded-none h-7 text-xs">
                Ακύρωση
              </Button>
              <Button onClick={handleSubmit} size="sm" className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-7 text-xs">
                {editingExpense ? 'Ενημέρωση' : 'Αποθήκευση'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List - Mobile Cards / Desktop Table */}
      <Card className="rounded-none">
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              Δεν υπάρχουν έξοδα
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="sm:hidden divide-y">
                {expenses.map((expense) => (
                  <div key={expense.id} className="p-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-400">{expense.expense_number}</span>
                        <span className="text-[10px] text-gray-400">{format(new Date(expense.expense_date), 'dd/MM')}</span>
                      </div>
                      <p className="text-sm truncate">{expense.description}</p>
                      {expense.category && (
                        <span className="text-[10px] text-gray-500">{expense.category}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-red-600 text-sm whitespace-nowrap">
                        €{Number(expense.amount).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                        className="rounded-none h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpenseToDelete(expense.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="rounded-none h-6 w-6 p-0 text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
                      <th className="text-left py-2 px-2">Περιγραφή</th>
                      <th className="text-left py-2 px-2">Κατηγορία</th>
                      <th className="text-right py-2 px-2">Ποσό</th>
                      <th className="text-center py-2 px-2">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-t hover:bg-gray-50">
                        <td className="py-2 px-2 font-mono text-[10px]">{expense.expense_number}</td>
                        <td className="py-2 px-2">{format(new Date(expense.expense_date), 'dd/MM/yy')}</td>
                        <td className="py-2 px-2 max-w-32 truncate">{expense.description}</td>
                        <td className="py-2 px-2">{expense.category || '-'}</td>
                        <td className="py-2 px-2 text-right font-medium text-red-600">
                          €{Number(expense.amount).toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(expense)}
                              className="rounded-none h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExpenseToDelete(expense.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="rounded-none h-6 w-6 p-0 text-red-600 hover:text-red-700"
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Διαγραφή Εξόδου</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Είστε σίγουροι; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none h-8 text-sm">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90 rounded-none h-8 text-sm"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};