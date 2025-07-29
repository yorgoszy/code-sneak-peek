import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ShopManagement as ShopManagementComponent } from "@/components/shop/ShopManagement";

export default function ShopManagement() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="h-full">
          <div className="h-full">
            <div className="py-4 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900">Διαχείριση Καταστήματος</h1>
              <p className="text-gray-600 mt-2">Διαχείριση αγορών και παραγγελιών</p>
            </div>
            <div className="py-4">
              <ShopManagementComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}