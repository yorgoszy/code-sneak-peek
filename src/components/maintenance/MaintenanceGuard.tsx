import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Wrench } from "lucide-react";

interface MaintenanceGuardProps {
  userRole: string | null;
  children: React.ReactNode;
}

// Maintenance ends on Friday 2026-02-06 at 23:59 (Greece timezone UTC+2)
const MAINTENANCE_END_DATE = new Date('2026-02-06T23:59:00+02:00');

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ userRole, children }) => {
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);

  useEffect(() => {
    const checkMaintenance = () => {
      const now = new Date();
      // Check if maintenance period is still active
      const maintenanceActive = now < MAINTENANCE_END_DATE;
      // Admin users bypass maintenance mode
      const isAdmin = userRole === 'admin';
      
      setIsMaintenanceActive(maintenanceActive && !isAdmin);
    };

    checkMaintenance();
    
    // Check every minute in case user stays on page past maintenance end
    const interval = setInterval(checkMaintenance, 60000);
    
    return () => clearInterval(interval);
  }, [userRole]);

  if (isMaintenanceActive) {
    return (
      <Dialog open={true}>
        <DialogContent 
          className="rounded-none max-w-md [&>button]:hidden" 
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-orange-100 rounded-full">
                <Wrench className="h-12 w-12 text-orange-600" />
              </div>
            </div>
            <DialogTitle className="text-xl text-center">Εργασίες Συντήρησης</DialogTitle>
            <DialogDescription className="text-center pt-4">
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Η πλατφόρμα είναι προσωρινά μη διαθέσιμη</span>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
};
