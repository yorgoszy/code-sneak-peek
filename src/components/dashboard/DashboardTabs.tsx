
export const DashboardTabs = () => {
  return (
    <div className="flex space-x-6 mb-6">
      <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-2">
        Επισκόπηση
      </button>
      <button className="text-sm font-medium text-gray-500 pb-2">
        Αναλυτικά
      </button>
      <button className="text-sm font-medium text-gray-500 pb-2">
        Αναφορές
      </button>
    </div>
  );
};
