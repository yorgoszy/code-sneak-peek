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
  refreshKey?: number;
}

export const CoachFinancialOverview: React.FC<CoachFinancialOverviewProps> = ({ coachId, refreshKey }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => new Date().getFullYear() - i).filter(year => year >= 2024);

  useEffect(() => {
    if (coachId) {
      fetchFinancialData();
    }
  }, [selectedYear, coachId, refreshKey]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const { data: monthlyExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('coach_id', coachId)
        .gte('expense_date', `${selectedYear}-01-01`)
        .lt('expense_date', `${selectedYear + 1}-01-01`);

      if (expensesError) throw expensesError;

      const monthlyExpMap = new Map<string, number>();
      monthlyExpenses?.forEach(expense => {
        const month = format(new Date(expense.expense_date), 'yyyy-MM');
        monthlyExpMap.set(month, (monthlyExpMap.get(month) || 0) + Number(expense.amount));
      });

      const { data: monthlyReceipts, error: receiptsError } = await supabase
        .from('coach_receipts')
        .select('amount, created_at')
        .eq('coach_id', coachId)
        .gte('created_at', `${selectedYear}-01-01`)
        .lt('created_at', `${selectedYear + 1}-01-01`);

      if (receiptsError) throw receiptsError;

      const monthlyRevMap = new Map<string, number>();
      monthlyReceipts?.forEach(receipt => {
        const month = format(new Date(receipt.created_at), 'yyyy-MM');
        monthlyRevMap.set(month, (monthlyRevMap.get(month) || 0) + Number(receipt.amount));
      });

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

      const yearlyResults = [];
      for (const year of years) {
        const { data: yearReceipts } = await supabase
          .from('coach_receipts')
          .select('amount')
          .eq('coach_id', coachId)
          .gte('created_at', `${year}-01-01`)
          .lt('created_at', `${year + 1}-01-01`);

        const { data: yearExpenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('coach_id', coachId)
          .gte('expense_date', `${year}-01-01`)
          .lt('expense_date', `${year + 1}-01-01`);

        const yearRevenue = yearReceipts?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
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
      <div className="flex items-center justify-center py-6">
        <span className="text-gray-500 text-sm">Φόρτωση...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Year Selector - Compact */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-24 h-8 text-sm rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {years.map(year => (
              <SelectItem key={year} value={year.toString()} className="rounded-none text-sm">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards - Current Month */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="rounded-none">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="text-[10px] sm:text-xs text-gray-500">Έσοδα (τρέχων μήνας)</span>
            </div>
            <span className="text-sm sm:text-lg font-bold text-green-600 block truncate">
              €{currentMonthData?.revenue.toFixed(0) || '0'}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
              <span className="text-[10px] sm:text-xs text-gray-500">Έξοδα (τρέχων μήνας)</span>
            </div>
            <span className="text-sm sm:text-lg font-bold text-red-600 block truncate">
              €{currentMonthData?.expenses.toFixed(0) || '0'}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-[#00ffba]" />
              <span className="text-[10px] sm:text-xs text-gray-500">Κέρδος (τρέχων μήνας)</span>
            </div>
            <span className={`text-sm sm:text-lg font-bold block truncate ${(currentMonthData?.profit || 0) >= 0 ? 'text-[#00ffba]' : 'text-red-600'}`}>
              €{currentMonthData?.profit.toFixed(0) || '0'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown - Compact Table */}
      <Card className="rounded-none">
        <CardHeader className="p-2 sm:p-4 pb-2">
          <CardTitle className="text-sm sm:text-base">Μηνιαία Ανάλυση</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-1.5 px-2 sm:py-2 sm:px-3">Μήνας</th>
                  <th className="text-right py-1.5 px-2 sm:py-2 sm:px-3">Έσοδα</th>
                  <th className="text-right py-1.5 px-2 sm:py-2 sm:px-3">Έξοδα</th>
                  <th className="text-right py-1.5 px-2 sm:py-2 sm:px-3">Κέρδος</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, index) => (
                  <tr key={month.month} className={`border-b ${index === currentMonthIndex ? 'bg-gray-50' : ''}`}>
                    <td className="py-1.5 px-2 sm:py-2 sm:px-3 font-medium capitalize text-xs sm:text-sm">{month.month.slice(0, 3)}</td>
                    <td className="py-1.5 px-2 sm:py-2 sm:px-3 text-right text-green-600">€{month.revenue.toFixed(0)}</td>
                    <td className="py-1.5 px-2 sm:py-2 sm:px-3 text-right text-red-600">€{month.expenses.toFixed(0)}</td>
                    <td className={`py-1.5 px-2 sm:py-2 sm:px-3 text-right font-medium ${month.profit >= 0 ? 'text-[#00ffba]' : 'text-red-600'}`}>
                      €{month.profit.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 bg-gray-50">
                  <td className="py-1.5 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Σύνολο</td>
                  <td className="py-1.5 px-2 sm:py-2 sm:px-3 text-right text-green-600">€{currentYearData?.revenue.toFixed(0) || '0'}</td>
                  <td className="py-1.5 px-2 sm:py-2 sm:px-3 text-right text-red-600">€{currentYearData?.expenses.toFixed(0) || '0'}</td>
                  <td className={`py-1.5 px-2 sm:py-2 sm:px-3 text-right ${(currentYearData?.profit || 0) >= 0 ? 'text-[#00ffba]' : 'text-red-600'}`}>
                    €{currentYearData?.profit.toFixed(0) || '0'}
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