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
import { Calendar as CalendarIcon, Plus, Edit2, Trash2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Expense {
  id: string;
  expense_number: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_number?: string;
  category?: string;
  created_at: string;
}

export const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expense_date: new Date(),
    receipt_number: '',
    category: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία φόρτωσης εξόδων",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateExpenseNumber = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('expense_number')
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
    const numberPart = parseInt(lastNumber.split('-')[1]);
    return `ΕΞ-${String(numberPart + 1).padStart(4, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      if (!formData.description || !formData.amount) {
        toast({
          title: "Σφάλμα",
          description: "Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία",
          variant: "destructive",
        });
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
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;

        toast({
          title: "Επιτυχία",
          description: "Το έξοδο ενημερώθηκε επιτυχώς",
        });
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData]);

        if (error) throw error;

        toast({
          title: "Επιτυχία",
          description: "Το έξοδο προστέθηκε επιτυχώς",
        });
      }

      setFormData({
        description: '',
        amount: '',
        expense_date: new Date(),
        receipt_number: '',
        category: ''
      });
      setShowAddForm(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης εξόδου",
        variant: "destructive",
      });
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

  const handleDelete = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το έξοδο διαγράφηκε επιτυχώς",
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής εξόδου",
        variant: "destructive",
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return <div>Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Διαχείριση Εξόδων</h2>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-none w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Προσθήκη Εξόδου
        </Button>
      </div>

      {/* Στατιστικά */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Σύνολο Εξόδων</p>
                <p className="text-lg sm:text-xl font-semibold">€{totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Αριθμός Εξόδων</p>
                <p className="text-lg sm:text-xl font-semibold">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Φόρμα προσθήκης/επεξεργασίας */}
      {showAddForm && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              {editingExpense ? 'Επεξεργασία Εξόδου' : 'Προσθήκη Νέου Εξόδου'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="description" className="text-sm">Περιγραφή *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Περιγραφή εξόδου"
                  className="rounded-none h-20"
                />
              </div>

              <div>
                <Label htmlFor="amount" className="text-sm">Ποσό *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="rounded-none"
                />
              </div>

              <div>
                <Label className="text-sm">Ημερομηνία Εξόδου</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-none"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.expense_date, "dd/MM/yyyy")}
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

              <div>
                <Label htmlFor="receipt_number" className="text-sm">Αριθμός Απόδειξης</Label>
                <Input
                  id="receipt_number"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  placeholder="Αριθμός απόδειξης"
                  className="rounded-none"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm">Κατηγορία</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε κατηγορία" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="εξοπλισμός">Εξοπλισμός</SelectItem>
                    <SelectItem value="ενοίκιο">Ενοίκιο</SelectItem>
                    <SelectItem value="λογαριασμοί">Λογαριασμοί</SelectItem>
                    <SelectItem value="προμήθειες">Προμήθειες</SelectItem>
                    <SelectItem value="διαφήμιση">Διαφήμιση</SelectItem>
                    <SelectItem value="άλλο">Άλλο</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSubmit}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none flex-1 sm:flex-none"
              >
                {editingExpense ? 'Ενημέρωση' : 'Αποθήκευση'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingExpense(null);
                  setFormData({
                    description: '',
                    amount: '',
                    expense_date: new Date(),
                    receipt_number: '',
                    category: ''
                  });
                }}
                className="rounded-none flex-1 sm:flex-none"
              >
                Ακύρωση
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Λίστα εξόδων */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Έξοδα</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Αριθμός</th>
                    <th className="text-left p-3 font-medium">Περιγραφή</th>
                    <th className="text-left p-3 font-medium">Ποσό</th>
                    <th className="text-left p-3 font-medium">Ημερομηνία</th>
                    <th className="text-left p-3 font-medium">Απόδειξη</th>
                    <th className="text-left p-3 font-medium">Κατηγορία</th>
                    <th className="text-left p-3 font-medium">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{expense.expense_number}</td>
                      <td className="p-3">{expense.description}</td>
                      <td className="p-3 font-semibold">€{expense.amount.toFixed(2)}</td>
                      <td className="p-3">{format(new Date(expense.expense_date), 'dd/MM/yyyy')}</td>
                      <td className="p-3">{expense.receipt_number || '-'}</td>
                      <td className="p-3">{expense.category || '-'}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                            className="rounded-none"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
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
                                  onClick={() => handleDelete(expense.id)}
                                  className="bg-red-600 hover:bg-red-700 rounded-none"
                                >
                                  Διαγραφή
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="border border-gray-200 rounded-none bg-white overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-sm">{expense.expense_number}</h5>
                      <p className="text-xs text-gray-500">{format(new Date(expense.expense_date), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-base text-red-600">€{expense.amount.toFixed(2)}</p>
                      {expense.category && (
                        <p className="text-xs text-gray-500 capitalize">{expense.category}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-3 space-y-2">
                  <div>
                    <p className="font-medium text-sm">{expense.description}</p>
                  </div>
                  
                  {expense.receipt_number && (
                    <div>
                      <p className="text-xs text-gray-500">Αριθμός Απόδειξης: {expense.receipt_number}</p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                        className="rounded-none flex-1 text-xs h-8"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Επεξεργασία
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-none flex-1 text-xs h-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Διαγραφή
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none max-w-sm mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base">Διαγραφή Εξόδου</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το έξοδο; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                            <AlertDialogCancel className="rounded-none w-full sm:w-auto">Ακύρωση</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(expense.id)}
                              className="bg-red-600 hover:bg-red-700 rounded-none w-full sm:w-auto"
                            >
                              Διαγραφή
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {expenses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Δεν βρέθηκαν έξοδα
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};