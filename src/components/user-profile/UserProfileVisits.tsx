import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, User, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfileVisitsProps {
  visits: any[];
  user: any;
}

export const UserProfileVisits = ({ visits, user }: UserProfileVisitsProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <p>Το ιστορικό επισκέψεων και τα πακέτα επισκέψεων μετακινήθηκαν στο Online Booking</p>
      </div>
    </div>
  );
};