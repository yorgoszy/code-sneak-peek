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

export const FinancialOverview: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => new Date().getFullYear() - i).filter(year => year >= 2024);

  useEffect(() => {
    fetchFinancialData();
  }, [selectedYear]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {

      // Fetch monthly expenses for selected year
      const { data: monthlyExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', `${selectedYear}-01-01`)
        .lt('expense_date', `${selectedYear + 1}-01-01`);

      if (expensesError) throw expensesError;

      // Group expenses by month
      const monthlyExpMap = new Map<string, number>();
      monthlyExpenses?.forEach(expense => {
        const month = format(new Date(expense.expense_date), 'yyyy-MM');
        monthlyExpMap.set(month, (monthlyExpMap.get(month) || 0) + Number(expense.amount));
      });

      // Fetch payments (receipts) for selected year to calculate monthly revenue
      const { data: monthlyPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('status', 'completed')
        .gte('payment_date', `${selectedYear}-01-01`)
        .lt('payment_date', `${selectedYear + 1}-01-01`);

      if (paymentsError) throw paymentsError;

      // Calculate monthly revenue based on payment date (receipt issue date)
      const monthlyRevMap = new Map<string, number>();
      monthlyPayments?.forEach(payment => {
        const month = format(new Date(payment.payment_date), 'yyyy-MM');
        monthlyRevMap.set(month, (monthlyRevMap.get(month) || 0) + Number(payment.amount));
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
        // Get payments (receipts) for the year
        const { data: yearPayments } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', `${year}-01-01`)
          .lt('payment_date', `${year + 1}-01-01`);

        const { data: yearExpenses } = await supabase
          .from('expenses')
          .select('amount')
          .gte('expense_date', `${year}-01-01`)
          .lt('expense_date', `${year + 1}-01-01`);

        // Calculate revenue from payments (receipt issue date)
        const revenue = yearPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        
        const expenses = yearExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        yearlyResults.push({
          year,
          revenue,
          expenses,
          profit: revenue - expenses
        });
      }
      setYearlyData(yearlyResults);

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

  const currentYearData = yearlyData.find(y => y.year === selectedYear);
  const currentYearTotal = currentYearData?.revenue || 0;
  const currentYearProfit = currentYearData?.profit || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Έσοδα - Έξοδα</h2>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32 rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Annual Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ετήσια Έσοδα</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(currentYearTotal)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ετήσια Έξοδα</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(currentYearData?.expenses || 0)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ετήσιο Κέρδος</CardTitle>
             {currentYearProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-blue-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentYearProfit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              {formatCurrency(currentYearProfit)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ετήσιος Τζίρος</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(currentYearTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Μηνιαία Ανάλυση {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthlyData.map((month, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded-none">
                <h4 className="font-semibold text-gray-900 mb-2">{month.month}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Έσοδα:</span>
                    <span className="text-blue-600 font-medium">{formatCurrency(month.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Έξοδα:</span>
                    <span className="text-red-500 font-medium">{formatCurrency(month.expenses)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">Κέρδος:</span>
                    <span className={`font-bold ${month.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {formatCurrency(month.profit)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Yearly Summary */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Ετήσια Σύγκριση</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {yearlyData.map((year) => (
              <div key={year.year} className="flex items-center justify-between p-4 border border-gray-200 rounded-none">
                <div className="font-semibold text-gray-900">{year.year}</div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Έσοδα: </span>
                    <span className="font-medium text-blue-600">{formatCurrency(year.revenue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Έξοδα: </span>
                    <span className="font-medium text-red-500">{formatCurrency(year.expenses)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Κέρδος: </span>
                    <span className={`font-bold ${year.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {formatCurrency(year.profit)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};