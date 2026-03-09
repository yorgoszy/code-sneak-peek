import React, { useState, useEffect } from 'react'; // force rebuild v2
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Plus, Swords, Calendar, MapPin, Users, Upload, Trash2, Edit, Eye, FileText, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CompetitionCategoriesDialog } from "@/components/federation/competitions/CompetitionCategoriesDialog";
import { CompetitionRegistrationsDialog } from "@/components/federation/competitions/CompetitionRegistrationsDialog";
import { CategoryTemplatesDialog } from "@/components/federation/competitions/CategoryTemplatesDialog";


interface Competition {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  competition_date: string;
  registration_deadline: string | null;
  regulations_pdf_url: string | null;
  status: string;
  created_at: string;
  categories_count?: number;
  registrations_count?: number;
}

const FederationCompetitions = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { t } = useTranslation();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [registrationsDialogOpen, setRegistrationsDialogOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [competitionToDelete, setCompetitionToDelete] = useState<string | null>(null);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formStatus, setFormStatus] = useState('upcoming');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.id) fetchCompetitions();
  }, [userProfile?.id]);

  const fetchCompetitions = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('federation_competitions')
        .select('*')
        .eq('federation_id', userProfile.id)
        .order('competition_date', { ascending: false });

      if (error) throw error;

      // Get counts
      const comps = data || [];
      const enriched = await Promise.all(comps.map(async (comp) => {
        const [catRes, regRes] = await Promise.all([
          supabase.from('federation_competition_categories').select('id', { count: 'exact', head: true }).eq('competition_id', comp.id),
          supabase.from('federation_competition_registrations').select('id', { count: 'exact', head: true }).eq('competition_id', comp.id),
        ]);
        return {
          ...comp,
          categories_count: catRes.count || 0,
          registrations_count: regRes.count || 0,
        };
      }));

      setCompetitions(enriched);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast.error('Σφάλμα φόρτωσης αγώνων');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormLocation('');
    setFormDate('');
    setFormDeadline('');
    setFormStatus('upcoming');
    setFormPdfUrl('');
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Μόνο αρχεία PDF επιτρέπονται');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Το αρχείο δεν πρέπει να υπερβαίνει τα 20MB');
      return;
    }

    setUploadingPdf(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('competition-regulations')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('competition-regulations')
        .getPublicUrl(fileName);

      setFormPdfUrl(urlData.publicUrl);
      toast.success('Το PDF ανέβηκε επιτυχώς');
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Σφάλμα ανεβάσματος PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleCreate = async () => {
    if (!formName || !formDate || !userProfile?.id) {
      toast.error('Συμπληρώστε τουλάχιστον όνομα και ημερομηνία');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('federation_competitions').insert({
        federation_id: userProfile.id,
        name: formName,
        description: formDescription || null,
        location: formLocation || null,
        competition_date: formDate,
        registration_deadline: formDeadline || null,
        regulations_pdf_url: formPdfUrl || null,
        status: formStatus,
      });
      if (error) throw error;
      toast.success('Ο αγώνας δημιουργήθηκε');
      setCreateDialogOpen(false);
      resetForm();
      fetchCompetitions();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα δημιουργίας αγώνα');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCompetition || !formName || !formDate) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('federation_competitions')
        .update({
          name: formName,
          description: formDescription || null,
          location: formLocation || null,
          competition_date: formDate,
          registration_deadline: formDeadline || null,
          regulations_pdf_url: formPdfUrl || null,
          status: formStatus,
        })
        .eq('id', selectedCompetition.id);
      if (error) throw error;
      toast.success('Ο αγώνας ενημερώθηκε');
      setEditDialogOpen(false);
      resetForm();
      setSelectedCompetition(null);
      fetchCompetitions();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα ενημέρωσης');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!competitionToDelete) return;
    try {
      const { error } = await supabase.from('federation_competitions').delete().eq('id', competitionToDelete);
      if (error) throw error;
      toast.success('Ο αγώνας διαγράφηκε');
      setDeleteDialogOpen(false);
      setCompetitionToDelete(null);
      fetchCompetitions();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα διαγραφής');
    }
  };

  const openEditDialog = (comp: Competition) => {
    setSelectedCompetition(comp);
    setFormName(comp.name);
    setFormDescription(comp.description || '');
    setFormLocation(comp.location || '');
    setFormDate(comp.competition_date);
    setFormDeadline(comp.registration_deadline || '');
    setFormStatus(comp.status);
    setFormPdfUrl(comp.regulations_pdf_url || '');
    setEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      upcoming: 'Επερχόμενος',
      active: 'Ενεργός',
      completed: 'Ολοκληρωμένος',
      cancelled: 'Ακυρωμένος',
    };
    return <Badge className={`rounded-none ${styles[status] || ''}`}>{labels[status] || status}</Badge>;
  };

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Όνομα Αγώνα *</Label>
        <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="π.χ. Πανελλήνιο Πρωτάθλημα 2026" className="rounded-none" />
      </div>
      <div>
        <Label>Περιγραφή</Label>
        <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Περιγραφή αγώνα..." className="rounded-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ημερομηνία *</Label>
          <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="rounded-none" />
        </div>
        <div>
          <Label>Τοποθεσία</Label>
          <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="π.χ. Αθήνα" className="rounded-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Deadline Δηλώσεων</Label>
          <Input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} className="rounded-none" />
        </div>
        <div>
          <Label>Κατάσταση</Label>
          <Select value={formStatus} onValueChange={setFormStatus}>
            <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="upcoming">Επερχόμενος</SelectItem>
              <SelectItem value="active">Ενεργός</SelectItem>
              <SelectItem value="completed">Ολοκληρωμένος</SelectItem>
              <SelectItem value="cancelled">Ακυρωμένος</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Κανονισμοί (PDF)</Label>
        <div className="flex items-center gap-2">
          <Input type="file" accept=".pdf" onChange={handlePdfUpload} className="rounded-none" disabled={uploadingPdf} />
          {formPdfUrl && (
            <a href={formPdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="rounded-none">
                <FileText className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
        {uploadingPdf && <p className="text-xs text-muted-foreground mt-1">Ανέβασμα...</p>}
      </div>
    </div>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">{renderSidebar()}</div>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Αγώνες</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Swords className="h-6 w-6" /> Αγώνες
                </h1>
                <p className="text-sm text-muted-foreground">Διαχείριση αγώνων και δηλώσεων αθλητών</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setTemplatesDialogOpen(true)} className="rounded-none">
                  <Settings className="h-4 w-4 mr-2" /> Διαχείριση Κατηγοριών
                </Button>
                <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="h-4 w-4 mr-2" /> Νέος Αγώνας
                </Button>
              </div>
            </div>

            {/* Mobile buttons */}
            <div className="lg:hidden mb-4 flex gap-2">
              <Button variant="outline" onClick={() => setTemplatesDialogOpen(true)} className="flex-1 rounded-none">
                <Settings className="h-4 w-4 mr-2" /> Κατηγορίες
              </Button>
              <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="flex-1 rounded-none bg-foreground text-background hover:bg-foreground/90">
                <Plus className="h-4 w-4 mr-2" /> Νέος Αγώνας
              </Button>
            </div>

            {/* Competition Cards */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Φόρτωση...</div>
            ) : competitions.length === 0 ? (
              <Card className="rounded-none">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Swords className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Δεν υπάρχουν αγώνες</p>
                  <p className="text-sm">Δημιουργήστε τον πρώτο αγώνα πατώντας "Νέος Αγώνας"</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {competitions.map(comp => (
                  <Card key={comp.id} className="rounded-none hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{comp.name}</CardTitle>
                        {getStatusBadge(comp.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(comp.competition_date), 'd MMMM yyyy', { locale: el })}</span>
                      </div>
                      {comp.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{comp.location}</span>
                        </div>
                      )}
                      {comp.registration_deadline && (
                        <div className="text-xs text-muted-foreground">
                          Deadline: {format(new Date(comp.registration_deadline), 'd MMM yyyy', { locale: el })}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Swords className="h-3 w-3" /> {comp.categories_count} κατηγορίες
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {comp.registrations_count} δηλώσεις
                        </span>
                      </div>

                      <div className="flex items-center gap-1 pt-2 border-t">
                        <Button variant="outline" size="sm" className="rounded-none flex-1" onClick={() => {
                          setSelectedCompetition(comp);
                          setCategoriesDialogOpen(true);
                        }}>
                          <Swords className="h-3 w-3 mr-1" /> Κατηγορίες
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-none flex-1" onClick={() => {
                          setSelectedCompetition(comp);
                          setRegistrationsDialogOpen(true);
                        }}>
                          <Users className="h-3 w-3 mr-1" /> Δηλώσεις
                        </Button>
                        {comp.regulations_pdf_url && (
                          <a href={comp.regulations_pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="rounded-none">
                              <FileText className="h-3 w-3" />
                            </Button>
                          </a>
                        )}
                        <Button variant="outline" size="sm" className="rounded-none" onClick={() => openEditDialog(comp)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-none text-destructive" onClick={() => {
                          setCompetitionToDelete(comp.id);
                          setDeleteDialogOpen(true);
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>Νέος Αγώνας</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-none">Ακύρωση</Button>
            <Button onClick={handleCreate} disabled={saving} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
              {saving ? 'Αποθήκευση...' : 'Δημιουργία'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>Επεξεργασία Αγώνα</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-none">Ακύρωση</Button>
            <Button onClick={handleEdit} disabled={saving} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια θα διαγράψει τον αγώνα, τις κατηγορίες και όλες τις δηλώσεις. Δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Categories Dialog */}
      {selectedCompetition && (
        <CompetitionCategoriesDialog
          isOpen={categoriesDialogOpen}
          onClose={() => { setCategoriesDialogOpen(false); fetchCompetitions(); }}
          competitionId={selectedCompetition.id}
          competitionName={selectedCompetition.name}
          federationId={userProfile?.id || ''}
        />
      )}

      {/* Registrations Dialog */}
      {selectedCompetition && (
        <CompetitionRegistrationsDialog
          isOpen={registrationsDialogOpen}
          onClose={() => { setRegistrationsDialogOpen(false); fetchCompetitions(); }}
          competitionId={selectedCompetition.id}
          competitionName={selectedCompetition.name}
        />
      )}

      {/* Category Templates Dialog */}
      {userProfile?.id && (
        <CategoryTemplatesDialog
          isOpen={templatesDialogOpen}
          onClose={() => setTemplatesDialogOpen(false)}
          federationId={userProfile.id}
        />
      )}
    </SidebarProvider>
  );
};

export default FederationCompetitions;
