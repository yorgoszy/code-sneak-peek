import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { IdCard } from 'lucide-react';

interface CardNumberWidgetProps {
  userId: string;
  setActiveTab?: (tab: string) => void;
}

export const CardNumberWidget = ({ userId }: CardNumberWidgetProps) => {
  const isMobile = useIsMobile();
  const [cardNumber, setCardNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('app_users')
      .select('card_number')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setCardNumber((data as any)?.card_number || null));
  }, [userId]);

  return (
    <div className={`text-center ${isMobile ? 'p-1' : 'p-2'} rounded-none flex flex-col min-w-0`}>
      <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
        <IdCard className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${cardNumber ? 'text-black' : 'text-gray-400'}`} />
      </div>
      <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'} ${cardNumber ? 'text-black' : 'text-gray-400'}`}>
        {cardNumber || '-'}
      </div>
      <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
        Αρ. Δελτίου
      </div>
    </div>
  );
};
