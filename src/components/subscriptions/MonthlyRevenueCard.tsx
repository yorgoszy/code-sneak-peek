import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { format, subMonths } from "date-fns";

export const MonthlyRevenueCard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [currentRevenue, setCurrentRevenue] = useState(0);
  const [previousRevenue, setPreviousRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Generate last 12 months for dropdown
  const greekMonths = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: `${greekMonths[date.getMonth()]} ${date.getFullYear()}`
    };
  });

  useEffect(() => {
    fetchMonthlyRevenue();
  }, [selectedMonth]);

  const fetchMonthlyRevenue = async () => {
    setLoading(true);
    try {
      // Current month revenue
      const { data: currentData, error: currentError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('payment_date', `${selectedMonth}-01`)
        .lt('payment_date', `${selectedMonth}-31`);

      if (currentError) throw currentError;

      const currentTotal = currentData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      setCurrentRevenue(currentTotal);

      // Previous month revenue for comparison
      const [year, month] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(year, month - 2, 1); // month - 2 because month is 1-indexed
      const prevMonthStr = format(prevDate, 'yyyy-MM');

      const { data: prevData, error: prevError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('payment_date', `${prevMonthStr}-01`)
        .lt('payment_date', `${prevMonthStr}-31`);

      if (prevError) throw prevError;

      const prevTotal = prevData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      setPreviousRevenue(prevTotal);

    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

  const difference = currentRevenue - previousRevenue;
  const percentageChange = previousRevenue > 0 ? (difference / previousRevenue) * 100 : 0;

  return (
    <Card className="rounded-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-[#00ffba] mr-2" />
            <span className="font-medium text-gray-900">Μηνιαίος Τζίρος</span>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32 h-8 text-xs rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {months.map(month => (
                <SelectItem key={month.value} value={month.value} className="text-xs">
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-[#00ffba]">
            {loading ? '...' : formatCurrency(currentRevenue)}
          </div>
          
          {!loading && previousRevenue > 0 && (
            <div className="flex items-center text-sm">
              {difference >= 0 ? (
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+{formatCurrency(Math.abs(difference))} ({percentageChange.toFixed(1)}%)</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>-{formatCurrency(Math.abs(difference))} ({Math.abs(percentageChange).toFixed(1)}%)</span>
                </div>
              )}
              <span className="ml-2 text-gray-500">από προηγ. μήνα</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};