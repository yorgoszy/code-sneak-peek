
import { useIsMobile } from "@/hooks/use-mobile";

export const DashboardTabs = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`flex ${isMobile ? 'space-x-4 mb-4' : 'space-x-6 mb-6'}`}>
      <button className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-600 border-b-2 border-blue-600 pb-2`}>
        Επισκόπηση
      </button>
      <button className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 pb-2`}>
        Αναλυτικά
      </button>
      <button className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 pb-2`}>
        Αναφορές
      </button>
    </div>
  );
};
