import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, MapPin, Video, X, Plus, Edit2, UserPlus } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useBookingSections } from "@/hooks/useBookingSections";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookingSession {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  booking_type: string;
  user_id: string;
  section_id: string;
  app_users?: {
    name: string;
    email: string;
  };
  booking_sections?: {
    name: string;
    description?: string;
  };
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  subscription_status: string;
}

export const AdminBookingManagement: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState<BookingSession[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedBookingType, setSelectedBookingType] = useState<string>('gym_visit');
  const [availableSlots, setAvailableSlots] = useState<{available: string[], full: string[], past: string[]}>({available: [], full: [], past: []});
  const { sections, getAvailableSlots } = useBookingSections();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadBookings();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate && selectedSection) {
      updateAvailableSlots();
    }
  }, [selectedDate, selectedSection]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadBookings()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, name, email, subscription_status')
      .order('name');

    if (error) {
      console.error('Error loading users:', error);
      return;
    }

    setUsers(data || []);
  };

  const loadBookings = async () => {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('booking_sessions')
      .select(`
        *,
        app_users(name, email),
        booking_sections(name, description)
      `)
      .eq('booking_date', dateStr)
      .neq('status', 'cancelled')
      .order('booking_time');

    if (error) {
      console.error('Error loading bookings:', error);
      return;
    }

    setBookings((data as any) || []);
  };

  const updateAvailableSlots = async () => {
    if (!selectedDate || !selectedSection) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const slots = await getAvailableSlots(selectedSection, dateStr);
    setAvailableSlots(slots);
    setSelectedTime('');
  };

  const handleCreateBooking = async () => {
    if (!selectedUser || !selectedSection || !selectedTime || !selectedDate) {
      toast.error('Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }

    try {
      const { error } = await supabase
        .from('booking_sessions')
        .insert({
          user_id: selectedUser,
          section_id: selectedSection,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          booking_time: selectedTime,
          booking_type: selectedBookingType,
          status: 'confirmed'
        });

      if (error) throw error;

      toast.success('Το ραντεβού δημιουργήθηκε επιτυχώς!');
      setIsAddBookingOpen(false);
      resetForm();
      await loadBookings();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error('Σφάλμα κατά τη δημιουργία του ραντεβού');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('booking_sessions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Το ραντεβού ακυρώθηκε επιτυχώς');
      await loadBookings();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error('Σφάλμα κατά την ακύρωση του ραντεβού');
    }
  };

  const resetForm = () => {
    setSelectedUser('');
    setSelectedSection('');
    setSelectedTime('');
    setSelectedBookingType('gym_visit');
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φορτώνω δεδομένα...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Διαχείριση Online Booking</span>
            </div>
            <Button
              onClick={() => setIsAddBookingOpen(true)}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Νέο Ραντεβού
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Επίλεξε Ημερομηνία</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < addDays(new Date(), -30)}
              className={cn("w-full pointer-events-auto")}
            />
          </CardContent>
        </Card>

        {/* Bookings for Selected Date */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Ραντεβού για {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Επίλεξε ημερομηνία'}
              </span>
              <Badge variant="outline" className="rounded-none">
                {bookings.length} ραντεβού
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν ραντεβού</h3>
                <p>Δεν έχουν κλειστεί ραντεβού για αυτή την ημερομηνία</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-none p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-[#00ffba] text-black rounded-none">
                          {booking.booking_type === 'videocall' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{booking.app_users?.name}</h4>
                          <p className="text-xs text-gray-500">{booking.app_users?.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs rounded-none">
                              {booking.booking_time}
                            </Badge>
                            <Badge variant="outline" className="text-xs rounded-none">
                              {booking.booking_sections?.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        className="rounded-none"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Booking Dialog */}
      <Dialog open={isAddBookingOpen} onOpenChange={setIsAddBookingOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader>
            <DialogTitle>Δημιουργία Νέου Ραντεβού</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Χρήστης</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επίλεξε χρήστη" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Τύπος Ραντεβού</label>
                <Select value={selectedBookingType} onValueChange={setSelectedBookingType}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gym_visit">Επίσκεψη Γυμναστηρίου</SelectItem>
                    <SelectItem value="videocall">Videocall Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Χώρος</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επίλεξε χώρο" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                      {section.description && (
                        <span className="text-xs text-gray-500"> - {section.description}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSection && (availableSlots.available.length > 0 || availableSlots.full.length > 0 || availableSlots.past.length > 0) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Διαθέσιμες Ώρες ({selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''})
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {/* Διαθέσιμες ώρες */}
                  {availableSlots.available.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      className="rounded-none"
                      onClick={() => setSelectedTime(time)}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {time}
                    </Button>
                  ))}
                  
                  {/* Γεμάτες ώρες */}
                  {availableSlots.full.map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      className="rounded-none opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {time}
                      <span className="text-xs ml-1">(γεμάτο)</span>
                    </Button>
                  ))}
                  
                  {/* Παρελθούσες ώρες */}
                  {availableSlots.past.map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      className="rounded-none opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {time}
                      <span className="text-xs ml-1">(παρελθόν)</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedSection && availableSlots.available.length === 0 && availableSlots.full.length === 0 && availableSlots.past.length === 0 && (
              <p className="text-sm text-gray-500">
                Δεν υπάρχουν διαθέσιμες ώρες για αυτή την ημερομηνία και χώρο
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddBookingOpen(false)} className="rounded-none">
              Ακύρωση
            </Button>
            <Button
              onClick={handleCreateBooking}
              disabled={!selectedUser || !selectedSection || !selectedTime}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              Δημιουργία Ραντεβού
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};