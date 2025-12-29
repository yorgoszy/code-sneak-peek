import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

interface FinancialData {
  revenue: number;
  expenses: number;
  profit: number;
}

interface MonthlyData extends FinancialData {
  month: string;
  year: number;
}

interface YearlyData extends FinancialData {
  year: number;
}

interface CoachFinancialOverviewProps {
  coachId: string;
}

export const CoachFinancialOverview: React.FC<CoachFinancialOverviewProps> = ({ coachId }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => new Date().getFullYear() - i).filter(year => year >= 2024);

  useEffect(() => {
    if (coachId) {
      fetchFinancialData();
    }
  }, [selectedYear, coachId]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Fetch monthly expenses for selected year (filtered by coach_id)
      const { data: monthlyExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('coach_id', coachId)
        .gte('expense_date', `${selectedYear}-01-01`)
        .lt('expense_date', `${selectedYear + 1}-01-01`);

      if (expensesError) throw expensesError;

      // Group expenses by month
      const monthlyExpMap = new Map<string, number>();
      monthlyExpenses?.forEach(expense => {
        const month = format(new Date(expense.expense_date), 'yyyy-MM');
        monthlyExpMap.set(month, (monthlyExpMap.get(month) || 0) + Number(expense.amount));
      });

      // Fetch receipts for selected year to calculate monthly revenue (filtered by coach_id)
      const { data: monthlyReceipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('total, issue_date')
        .eq('coach_id', coachId)
        .gte('issue_date', `${selectedYear}-01-01`)
        .lt('issue_date', `${selectedYear + 1}-01-01`);

      if (receiptsError) throw receiptsError;

      // Calculate monthly revenue based on receipt issue date
      const monthlyRevMap = new Map<string, number>();
      monthlyReceipts?.forEach(receipt => {
        const month = format(new Date(receipt.issue_date), 'yyyy-MM');
        monthlyRevMap.set(month, (monthlyRevMap.get(month) || 0) + Number(receipt.total));
      });

      // Create monthly data with both revenue and expenses
      const months = [];
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${selectedYear}-${month.toString().padStart(2, '0')}`;
        const revenue = monthlyRevMap.get(monthKey) || 0;
        const expenses = monthlyExpMap.get(monthKey) || 0;
        months.push({
          month: format(new Date(selectedYear, month - 1), 'MMMM', { locale: el }),
          year: selectedYear,
          revenue,
          expenses,
          profit: revenue - expenses
        });
      }
      setMonthlyData(months);

      // Fetch yearly data
      const yearlyResults = [];
      for (const year of years) {
        // Get receipts for the year
        const { data: yearReceipts } = await supabase
          .from('receipts')
          .select('total')
          .eq('coach_id', coachId)
          .gte('issue_date', `${year}-01-01`)
          .lt('issue_date', `${year + 1}-01-01`);

        const { data: yearExpenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('coach_id', coachId)
          .gte('expense_date', `${year}-01-01`)
          .lt('expense_date', `${year + 1}-01-01`);

        const yearRevenue = yearReceipts?.reduce((sum, r) => sum + Number(r.total), 0) || 0;
        const yearExpenseTotal = yearExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        yearlyResults.push({
          year,
          revenue: yearRevenue,
          expenses: yearExpenseTotal,
          profit: yearRevenue - yearExpenseTotal
        });
      }
      setYearlyData(yearlyResults);

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentYearData = yearlyData.find(y => y.year === selectedYear);
  const currentMonthIndex = new Date().getMonth();
  const currentMonthData = monthlyData[currentMonthIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-gray-500">Φόρτωση οικονομικών στοιχείων...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center gap-4">
        <Calendar className="h-5 w-5 text-gray-500" />
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-32 rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {years.map(year => (
              <SelectItem key={year} value={year.toString()} className="rounded-none">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Έσοδα {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                €{currentYearData?.revenue.toFixed(2) || '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Έξοδα {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                €{currentYearData?.expenses.toFixed(2) || '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Κέρδος {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#00ffba]" />
              <span className={`text-2xl font-bold ${(currentYearData?.profit || 0) >= 0 ? 'text-[#00ffba]' : 'text-red-600'}`}>
                €{currentYearData?.profit.toFixed(2) || '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Μηνιαία Ανάλυση {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Μήνας</th>
                  <th className="text-right py-2 px-2">Έσοδα</th>
                  <th className="text-right py-2 px-2">Έξοδα</th>
                  <th className="text-right py-2 px-2">Κέρδος</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, index) => (
                  <tr key={month.month} className={`border-b ${index === currentMonthIndex ? 'bg-gray-50' : ''}`}>
                    <td className="py-2 px-2 font-medium capitalize">{month.month}</td>
                    <td className="py-2 px-2 text-right text-green-600">€{month.revenue.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-red-600">€{month.expenses.toFixed(2)}</td>
                    <td className={`py-2 px-2 text-right font-medium ${month.profit >= 0 ? 'text-[#00ffba]' : 'text-red-600'}`}>
                      €{month.profit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2">
                  <td className="py-2 px-2">Σύνολο</td>
                  <td className="py-2 px-2 text-right text-green-600">€{currentYearData?.revenue.toFixed(2) || '0.00'}</td>
                  <td className="py-2 px-2 text-right text-red-600">€{currentYearData?.expenses.toFixed(2) || '0.00'}</td>
                  <td className={`py-2 px-2 text-right ${(currentYearData?.profit || 0) >= 0 ? 'text-[#00ffba]' : 'text-red-600'}`}>
                    €{currentYearData?.profit.toFixed(2) || '0.00'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
