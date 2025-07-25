import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Clock, Users, X } from "lucide-react";
import { useWaitingList } from "@/hooks/useWaitingList";

interface WaitingListButtonProps {
  sectionId: string;
  bookingDate: string;
  bookingTime: string;
  isTimeSlotFull: boolean;
  bookingType?: string;
  onStatusChange?: () => void;
}

export const WaitingListButton: React.FC<WaitingListButtonProps> = ({
  sectionId,
  bookingDate,
  bookingTime,
  isTimeSlotFull,
  bookingType = 'gym_visit',
  onStatusChange
}) => {
  const { loading, joinWaitingList, leaveWaitingList, getWaitingListStatus } = useWaitingList();
  const [waitingStatus, setWaitingStatus] = useState({
    position: null as number | null,
    total_waiting: 0,
    is_waiting: false
  });

  useEffect(() => {
    if (isTimeSlotFull) {
      fetchWaitingStatus();
    }
  }, [sectionId, bookingDate, bookingTime, isTimeSlotFull]);

  const fetchWaitingStatus = async () => {
    const status = await getWaitingListStatus(sectionId, bookingDate, bookingTime, bookingType);
    setWaitingStatus(status);
  };

  const handleJoinWaitingList = async () => {
    const success = await joinWaitingList(sectionId, bookingDate, bookingTime, bookingType);
    if (success) {
      await fetchWaitingStatus();
      onStatusChange?.();
    }
  };

  const handleLeaveWaitingList = async () => {
    const success = await leaveWaitingList(sectionId, bookingDate, bookingTime, bookingType);
    if (success) {
      await fetchWaitingStatus();
      onStatusChange?.();
    }
  };

  // Don't show if time slot is not full
  if (!isTimeSlotFull) {
    return null;
  }

  return (
    <div className="space-y-2">
      {waitingStatus.is_waiting ? (
        <div className="space-y-2">
          <Button
            onClick={handleLeaveWaitingList}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
          >
            <X className="w-4 h-4 mr-2" />
            Αφαίρεση από Λίστα Αναμονής
          </Button>
          <div className="text-xs text-gray-600 text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              Θέση #{waitingStatus.position} από {waitingStatus.total_waiting}
            </div>
            <p className="mt-1">Θα ειδοποιηθείτε όταν ελευθερωθεί θέση</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            onClick={handleJoinWaitingList}
            disabled={loading}
            size="sm"
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Clock className="w-4 h-4 mr-2" />
            Λίστα Αναμονής
          </Button>
          {waitingStatus.total_waiting > 0 && (
            <div className="text-xs text-gray-600 text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="w-3 h-3" />
                {waitingStatus.total_waiting} άτομα στη λίστα αναμονής
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};