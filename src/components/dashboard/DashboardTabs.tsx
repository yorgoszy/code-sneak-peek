
import { useIsMobile } from "@/hooks/use-mobile";

export const DashboardTabs = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`flex space-x-3 md:space-x-6 mb-4 md:mb-6 ${isMobile ? 'overflow-x-auto' : ''}`}>
      <button className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-600 border-b-2 border-blue-600 pb-2 whitespace-nowrap`}>
        Επισκόπηση
      </button>
      <button className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 pb-2 whitespace-nowrap`}>
        Αναλυτικά
      </button>
      <button className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 pb-2 whitespace-nowrap`}>
        Αναφορές
      </button>
    </div>
  );
};
