import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AvailableHoursSelector } from "./AvailableHoursSelector";
import { useIsMobile } from "@/hooks/use-mobile";

interface BookingSection {
  id: string;
  name: string;
  description?: string;
  max_capacity: number;
  available_hours: Record<string, string[]>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const BookingSectionsManagement = () => {
  const isMobile = useIsMobile();
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<BookingSection | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    max_capacity: number;
    available_hours: Record<string, string[]>;
  }>({
    name: '',
    description: '',
    max_capacity: 10,
    available_hours: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sections')
        .select('*')
        .order('name');

      if (error) throw error;
      setSections((data as BookingSection[]) || []);
    } catch (error: any) {
      toast.error('Σφάλμα κατά τη φόρτωση των τμημάτων: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSection) {
        // Update existing section
        const { error } = await supabase
          .from('booking_sections')
          .update({
            name: formData.name,
            description: formData.description || null,
            max_capacity: formData.max_capacity,
            available_hours: formData.available_hours
          })
          .eq('id', editingSection.id);

        if (error) throw error;
        toast.success('Το τμήμα ενημερώθηκε επιτυχώς');
      } else {
        // Create new section
        const { error } = await supabase
          .from('booking_sections')
          .insert({
            name: formData.name,
            description: formData.description || null,
            max_capacity: formData.max_capacity,
            available_hours: formData.available_hours
          });

        if (error) throw error;
        toast.success('Το τμήμα δημιουργήθηκε επιτυχώς');
      }

      resetForm();
      setIsDialogOpen(false);
      await fetchSections();
    } catch (error: any) {
      toast.error('Σφάλμα: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: BookingSection) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      description: section.description || '',
      max_capacity: section.max_capacity,
      available_hours: section.available_hours as Record<string, string[]>
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (section: BookingSection) => {
    try {
      const { error } = await supabase
        .from('booking_sections')
        .update({ is_active: !section.is_active })
        .eq('id', section.id);

      if (error) throw error;
      
      toast.success(section.is_active ? 'Τμήμα απενεργοποιήθηκε' : 'Τμήμα ενεργοποιήθηκε');
      await fetchSections();
    } catch (error: any) {
      toast.error('Σφάλμα: ' + error.message);
    }
  };

  const handleDelete = async (section: BookingSection) => {
    try {
      // Έλεγχος αν υπάρχουν ενεργές κρατήσεις για αυτό το τμήμα
      const { data: activeBookings, error: bookingsError } = await supabase
        .from('booking_sessions')
        .select('id')
        .eq('section_id', section.id)
        .in('status', ['confirmed', 'pending'])
        .limit(1);

      if (bookingsError) throw bookingsError;

      if (activeBookings && activeBookings.length > 0) {
        toast.error('Δεν μπορείτε να διαγράψετε το τμήμα γιατί έχει ενεργές κρατήσεις');
        return;
      }

      const { error } = await supabase
        .from('booking_sections')
        .delete()
        .eq('id', section.id);

      if (error) throw error;
      
      toast.success('Το τμήμα διαγράφηκε επιτυχώς');
      await fetchSections();
    } catch (error: any) {
      toast.error('Σφάλμα κατά τη διαγραφή: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      max_capacity: 10,
      available_hours: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }
    });
    setEditingSection(null);
  };

  if (loading && sections.length === 0) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
        <div>
          <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
            {isMobile ? 'Τμήματα' : 'Διαχείριση Τμημάτων'}
          </h2>
          {!isMobile && (
            <p className="text-gray-600">Δημιουργήστε και διαχειριστείτε τα τμήματα του γυμναστηρίου</p>
          )}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm} 
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              size={isMobile ? "sm" : "default"}
            >
              <Plus className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${isMobile ? '' : 'mr-2'}`} />
              {isMobile ? 'Νέο' : 'Νέο Τμήμα'}
            </Button>
          </DialogTrigger>
          <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-4xl max-h-[90vh]'} overflow-y-auto rounded-none`}>
            <DialogHeader>
              <DialogTitle>
                {editingSection ? 'Επεξεργασία Τμήματος' : 'Νέο Τμήμα'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                <div>
                  <Label htmlFor="name">Όνομα Τμήματος</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-none"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Μέγιστη Χωρητικότητα</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseInt(e.target.value) }))}
                    className="rounded-none"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Περιγραφή (προαιρετική)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="rounded-none"
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <AvailableHoursSelector
                  availableHours={formData.available_hours}
                  onChange={(hours) => setFormData(prev => ({ ...prev, available_hours: hours }))}
                />
              </div>
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-end space-x-2'}`}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  className="rounded-none"
                  size={isMobile ? "sm" : "default"}
                >
                  Ακύρωση
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                  size={isMobile ? "sm" : "default"}
                >
                  {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} ${isMobile ? 'gap-3' : 'gap-6'}`}>
        {sections.map((section) => (
          <Card key={section.id} className={`rounded-none ${!section.is_active ? 'opacity-50' : ''}`}>
            <CardHeader className={isMobile ? 'p-3 pb-2' : ''}>
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
                <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>{section.name}</CardTitle>
                <div className="flex items-center space-x-1">
                  <Badge variant={section.is_active ? "default" : "secondary"} className="rounded-none text-xs">
                    {section.is_active ? 'Ενεργό' : 'Ανενεργό'}
                  </Badge>
                </div>
              </div>
              {section.description && (
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>{section.description}</p>
              )}
            </CardHeader>
            <CardContent className={isMobile ? 'p-3 pt-0' : ''}>
              <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                <div className="flex items-center space-x-2">
                  <Users className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500`} />
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {isMobile ? `Χωρητικότητα: ${section.max_capacity}` : `Μέγιστη χωρητικότητα: ${section.max_capacity} άτομα`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500`} />
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {isMobile ? 'Ώρες: ' : 'Διαθέσιμες ώρες: '}{
                      Object.entries(section.available_hours)
                        .filter(([day, hours]) => hours && hours.length > 0)
                        .map(([day, hours]) => `${day}: ${hours.length}h`)
                        .join(', ') || 'Καμία ημέρα'
                    }
                  </span>
                </div>
                <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'} pt-2`}>
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "sm"}
                    onClick={() => handleEdit(section)}
                    className={`rounded-none ${isMobile ? 'flex-1' : 'flex-1'}`}
                  >
                    <Edit className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-3 h-3 mr-1'}`} />
                    {isMobile ? 'Επεξεργασία' : 'Επεξεργασία'}
                  </Button>
                  {!isMobile && (
                    <Button
                      variant={section.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(section)}
                      className="rounded-none"
                    >
                      {section.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                    </Button>
                  )}
                  {isMobile && (
                    <Button
                      variant={section.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(section)}
                      className="rounded-none flex-1"
                    >
                      {section.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className={`rounded-none ${isMobile ? 'px-3' : 'px-2'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                        {isMobile && <span className="ml-1 text-xs">Διαγραφή</span>}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Διαγραφή Τμήματος</AlertDialogTitle>
                        <AlertDialogDescription>
                          Είστε σίγουροι ότι θέλετε να διαγράψετε το τμήμα "{section.name}";
                          <br />
                          <strong>Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</strong>
                          <br />
                          Δεν μπορείτε να διαγράψετε τμήμα που έχει ενεργές κρατήσεις.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(section)}
                          className="bg-red-600 hover:bg-red-700 rounded-none"
                        >
                          Διαγραφή
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.length === 0 && !loading && (
        <Card className="rounded-none">
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν τμήματα</h3>
            <p className="text-gray-600 mb-4">Δημιουργήστε το πρώτο τμήμα για να ξεκινήσετε τις κρατήσεις</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};