import { useHealthCard } from '@/hooks/useHealthCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { HeartPulse, AlertTriangle, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HealthCardWidgetProps {
  userId: string;
  setActiveTab?: (tab: string) => void;
}

export const HealthCardWidget = ({ userId, setActiveTab }: HealthCardWidgetProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { healthCard, getDaysUntilExpiry, isExpiringSoon, isExpired } = useHealthCard(userId);

  const daysLeft = getDaysUntilExpiry();
  const expiring = isExpiringSoon();
  const expired = isExpired();

  const handleClick = () => {
    if (setActiveTab) {
      setActiveTab('health-card');
    } else {
      navigate(`/dashboard/user-profile/${userId}?tab=health-card`);
    }
  };

  const getStatusColor = () => {
    if (!healthCard) return 'text-gray-400';
    if (expired) return 'text-red-500';
    if (expiring) return 'text-orange-500';
    return 'text-black';
  };

  const getDisplayValue = () => {
    if (!healthCard) return '-';
    if (expired) return <X className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`} />;
    if (daysLeft !== null) return daysLeft;
    return '-';
  };

  const getValueColor = () => {
    if (!healthCard || daysLeft === null) return 'text-gray-400';
    if (expired) return 'text-red-500';
    if (daysLeft < 30) return 'text-red-600'; // Κάτω από 1 μήνα = κόκκινο
    if (daysLeft < 60) return 'text-orange-600'; // Κάτω από 2 μήνες = πορτοκαλί
    return 'text-green-600';
  };

  return (
    <div 
      className={`text-center ${isMobile ? 'p-1' : 'p-2'} rounded-none flex flex-col min-w-0`}
    >
      <div className={`${isMobile ? 'h-6' : 'h-10'} flex items-center justify-center`}>
        <HeartPulse className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} ${getStatusColor()}`} />
      </div>
      <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center font-bold ${isMobile ? 'text-base' : 'text-2xl'} ${getValueColor()}`}>
        {getDisplayValue()}
      </div>
      <div className={`${isMobile ? 'h-8' : 'h-12'} flex items-center justify-center text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} text-center leading-tight`}>
        {t('healthCard.widget')}
      </div>
    </div>
  );
};
