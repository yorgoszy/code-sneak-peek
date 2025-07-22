import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingSection {
  id: string;
  name: string;
  description?: string;
  max_capacity: number;
  available_hours: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const BookingSectionsManagement = () => {
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<BookingSection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_capacity: 10,
    available_hours: {
      monday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
      tuesday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
      wednesday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
      thursday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
      friday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
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
      setSections(data || []);
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
      available_hours: section.available_hours
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      max_capacity: 10,
      available_hours: {
        monday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
        tuesday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
        wednesday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
        thursday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
        friday: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Διαχείριση Τμημάτων</h2>
          <p className="text-gray-600">Δημιουργήστε και διαχειριστείτε τα τμήματα του γυμναστηρίου</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none">
              <Plus className="w-4 h-4 mr-2" />
              Νέο Τμήμα
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-none">
            <DialogHeader>
              <DialogTitle>
                {editingSection ? 'Επεξεργασία Τμήματος' : 'Νέο Τμήμα'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label>Διαθέσιμες Ώρες</Label>
                <p className="text-sm text-gray-500 mb-2">Δευτέρα-Παρασκευή: 08:00-20:00 (κλειστά Σαβ/Κυρ)</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-none">
                  Ακύρωση
                </Button>
                <Button type="submit" disabled={loading} className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none">
                  {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Card key={section.id} className={`rounded-none ${!section.is_active ? 'opacity-50' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{section.name}</CardTitle>
                <div className="flex items-center space-x-1">
                  <Badge variant={section.is_active ? "default" : "secondary"} className="rounded-none">
                    {section.is_active ? 'Ενεργό' : 'Ανενεργό'}
                  </Badge>
                </div>
              </div>
              {section.description && (
                <p className="text-sm text-gray-600">{section.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Μέγιστη χωρητικότητα: {section.max_capacity} άτομα</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    Διαθέσιμες ώρες: {Object.keys(section.available_hours).length} ημέρες
                  </span>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(section)}
                    className="rounded-none flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Επεξεργασία
                  </Button>
                  <Button
                    variant={section.is_active ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(section)}
                    className="rounded-none"
                  >
                    {section.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                  </Button>
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