import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchFinancialData();
  }, [selectedYear]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Fetch monthly revenue for selected year
      const { data: monthlyRevenue, error: revenueError } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('status', 'completed')
        .gte('payment_date', `${selectedYear}-01-01`)
        .lt('payment_date', `${selectedYear + 1}-01-01`);

      if (revenueError) throw revenueError;

      // Group by month
      const monthlyRevMap = new Map<string, number>();
      monthlyRevenue?.forEach(payment => {
        const month = format(new Date(payment.payment_date), 'yyyy-MM');
        monthlyRevMap.set(month, (monthlyRevMap.get(month) || 0) + Number(payment.amount));
      });

      // Create monthly data (for now, expenses are 0 - you can add expenses table later)
      const months = [];
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${selectedYear}-${month.toString().padStart(2, '0')}`;
        const revenue = monthlyRevMap.get(monthKey) || 0;
        const expenses = 0; // TODO: Add expenses calculation
        months.push({
          month: format(new Date(selectedYear, month - 1), 'MMMM'),
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
        const { data: yearRevenue } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', `${year}-01-01`)
          .lt('payment_date', `${year + 1}-01-01`);

        const revenue = yearRevenue?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const expenses = 0; // TODO: Add expenses calculation
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ετήσιος Τζίρος</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00ffba]">{formatCurrency(currentYearTotal)}</div>
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
              <TrendingUp className="h-4 w-4 text-[#00ffba]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentYearProfit >= 0 ? 'text-[#00ffba]' : 'text-red-500'}`}>
              {formatCurrency(currentYearProfit)}
            </div>
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
                    <span className="text-[#00ffba] font-medium">{formatCurrency(month.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Έξοδα:</span>
                    <span className="text-red-500 font-medium">{formatCurrency(month.expenses)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">Κέρδος:</span>
                    <span className={`font-bold ${month.profit >= 0 ? 'text-[#00ffba]' : 'text-red-500'}`}>
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
                    <span className="font-medium text-[#00ffba]">{formatCurrency(year.revenue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Έξοδα: </span>
                    <span className="font-medium text-red-500">{formatCurrency(year.expenses)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Κέρδος: </span>
                    <span className={`font-bold ${year.profit >= 0 ? 'text-[#00ffba]' : 'text-red-500'}`}>
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