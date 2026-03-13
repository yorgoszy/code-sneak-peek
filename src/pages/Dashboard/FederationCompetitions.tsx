import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Plus, Swords, Calendar, MapPin, Users, Upload, Trash2, Edit, Eye, FileText, Settings, Trophy, ExternalLink, Clock, Star, BookmarkPlus } from "lucide-react";
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
import { GooglePlacesAutocomplete } from "@/components/ui/google-places-autocomplete";


interface Competition {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  competition_date: string;
  end_date: string | null;
  competition_flow: string;
  registration_deadline: string | null;
  late_registration_deadline: string | null;
  regulations_pdf_url: string | null;
  status: string;
  created_at: string;
  categories_count?: number;
  registrations_count?: number;
  counts_for_ranking?: boolean;
}

const FederationCompetitions = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { t, i18n } = useTranslation();

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
  const [formLocationUrl, setFormLocationUrl] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formFlow, setFormFlow] = useState('weigh_in_first');
  const [formDeadline, setFormDeadline] = useState('');
  const [formLateDeadline, setFormLateDeadline] = useState('');
  const [formStatus, setFormStatus] = useState('upcoming');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formCountsForRanking, setFormCountsForRanking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedVenues, setSavedVenues] = useState<Array<{ id: string; name: string; location_url: string | null }>>([]);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (userProfile?.id) {
      fetchCompetitions();
      fetchSavedVenues();
    }
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

      const comps = data || [];
      const enriched = await Promise.all(comps.map(async (comp) => {
        const [catRes, regRes] = await Promise.all([
          supabase.from('federation_competition_categories').select('id', { count: 'exact', head: true }).eq('competition_id', comp.id),
          supabase.from('federation_competition_registrations').select('id', { count: 'exact', head: true }).eq('competition_id', comp.id).eq('is_paid', true),
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
      toast.error(t('federation.competitions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedVenues = async () => {
    if (!userProfile?.id) return;
    const { data } = await supabase
      .from('federation_saved_venues')
      .select('*')
      .eq('federation_id', userProfile.id)
      .order('name');
    setSavedVenues(data || []);
  };

  const saveVenue = async () => {
    if (!userProfile?.id || !formLocation) return;
    const { error } = await supabase
      .from('federation_saved_venues')
      .upsert({
        federation_id: userProfile.id,
        name: formLocation,
        location_url: formLocationUrl || null,
      }, { onConflict: 'federation_id,name' });
    if (error) {
      toast.error(t('federation.competitions.venueSaveError'));
    } else {
      toast.success(t('federation.competitions.venueSaved'));
      fetchSavedVenues();
    }
  };

  const deleteVenue = async (id: string) => {
    await supabase.from('federation_saved_venues').delete().eq('id', id);
    fetchSavedVenues();
  };

  const selectSavedVenue = (venue: { name: string; location_url: string | null }) => {
    setFormLocation(venue.name);
    setFormLocationUrl(venue.location_url || '');
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormLocation('');
    setFormLocationUrl('');
    setMapCoords(null);
    setFormDate('');
    setFormDeadline('');
    setFormLateDeadline('');
    setFormStatus('upcoming');
    setFormPdfUrl('');
    setFormCountsForRanking(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error(t('federation.competitions.onlyPdf'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(t('federation.competitions.fileTooLarge'));
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
      toast.success(t('federation.competitions.pdfUploaded'));
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error(t('federation.competitions.pdfUploadError'));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleCreate = async () => {
    if (!formName || !formDate || !userProfile?.id) {
      toast.error(t('federation.competitions.fillRequired'));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('federation_competitions').insert({
        federation_id: userProfile.id,
        name: formName,
        description: formDescription || null,
        location: formLocation || null,
        location_url: formLocationUrl || null,
        competition_date: formDate,
        registration_deadline: formDeadline || null,
        late_registration_deadline: formLateDeadline || null,
        regulations_pdf_url: formPdfUrl || null,
        status: formStatus,
        counts_for_ranking: formCountsForRanking,
      });
      if (error) throw error;
      toast.success(t('federation.competitions.created'));
      setCreateDialogOpen(false);
      resetForm();
      fetchCompetitions();
    } catch (error) {
      console.error(error);
      toast.error(t('federation.competitions.createError'));
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
          location_url: formLocationUrl || null,
          competition_date: formDate,
          registration_deadline: formDeadline || null,
          late_registration_deadline: formLateDeadline || null,
          regulations_pdf_url: formPdfUrl || null,
          status: formStatus,
          counts_for_ranking: formCountsForRanking,
        })
        .eq('id', selectedCompetition.id);
      if (error) throw error;
      toast.success(t('federation.competitions.updated'));
      setEditDialogOpen(false);
      resetForm();
      setSelectedCompetition(null);
      fetchCompetitions();
    } catch (error) {
      console.error(error);
      toast.error(t('federation.competitions.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!competitionToDelete) return;
    try {
      const { error } = await supabase.from('federation_competitions').delete().eq('id', competitionToDelete);
      if (error) throw error;
      toast.success(t('federation.competitions.deleted'));
      setDeleteDialogOpen(false);
      setCompetitionToDelete(null);
      fetchCompetitions();
    } catch (error) {
      console.error(error);
      toast.error(t('federation.competitions.deleteError'));
    }
  };

  const openEditDialog = (comp: Competition) => {
    setSelectedCompetition(comp);
    setFormName(comp.name);
    setFormDescription(comp.description || '');
    setFormLocation(comp.location || '');
    setFormLocationUrl(comp.location_url || '');
    setFormDate(comp.competition_date);
    setFormDeadline(comp.registration_deadline || '');
    setFormLateDeadline(comp.late_registration_deadline || '');
    setFormStatus(comp.status);
    setFormPdfUrl(comp.regulations_pdf_url || '');
    setFormCountsForRanking(comp.counts_for_ranking || false);
    setEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const key = `federation.competitions.status${status.charAt(0).toUpperCase() + status.slice(1)}`;
    return <Badge className={`rounded-none ${styles[status] || ''}`}>{t(key)}</Badge>;
  };

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  const dateLocale = i18n.language === 'el' ? el : undefined;

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <Label>{t('federation.competitions.competitionName')} *</Label>
        <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder={t('federation.competitions.competitionNamePlaceholder')} className="rounded-none" />
      </div>
      <div>
        <Label>{t('federation.competitions.description')}</Label>
        <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder={t('federation.competitions.descriptionPlaceholder')} className="rounded-none" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{t('federation.competitions.competitionDate')} *</Label>
          <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="rounded-none" />
        </div>
        <div>
          <Label>{t('federation.competitions.status')}</Label>
          <Select value={formStatus} onValueChange={setFormStatus}>
            <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="upcoming">{t('federation.competitions.statusUpcoming')}</SelectItem>
              <SelectItem value="active">{t('federation.competitions.statusActive')}</SelectItem>
              <SelectItem value="completed">{t('federation.competitions.statusCompleted')}</SelectItem>
              <SelectItem value="cancelled">{t('federation.competitions.statusCancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Location */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t('federation.competitions.location')}</Label>
          {formLocation && (
            <Button type="button" variant="ghost" size="sm" onClick={saveVenue} className="rounded-none text-xs gap-1 h-6 px-2">
              <BookmarkPlus className="w-3 h-3" />
              {t('federation.competitions.locationSave')}
            </Button>
          )}
        </div>
        
        {savedVenues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {savedVenues.map(venue => (
              <div key={venue.id} className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant={formLocation === venue.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectSavedVenue(venue)}
                  className="rounded-none text-xs h-7 gap-1"
                >
                  <Star className="w-3 h-3" />
                  {venue.name}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteVenue(venue.id)}
                  className="rounded-none h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <GooglePlacesAutocomplete
          value={formLocation}
          onChange={setFormLocation}
          onPlaceSelect={(place) => {
            setFormLocation(place.name);
            setFormLocationUrl(place.url);
            if (place.lat && place.lng) {
              setMapCoords({ lat: place.lat, lng: place.lng });
            }
          }}
          placeholder={t('federation.competitions.locationSearch')}
          showMap={!!mapCoords}
        />

        <div>
          <Label className="text-xs text-muted-foreground">{t('federation.competitions.googleMapsLink')}</Label>
          <Input value={formLocationUrl} onChange={e => setFormLocationUrl(e.target.value)} placeholder="https://maps.google.com/..." className="rounded-none text-xs" />
        </div>
      </div>

      {/* Deadlines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{t('federation.competitions.earlyDeadline')}</Label>
          <Input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} className="rounded-none" />
        </div>
        <div>
          <Label>{t('federation.competitions.lateDeadline')}</Label>
          <Input type="date" value={formLateDeadline} onChange={e => setFormLateDeadline(e.target.value)} className="rounded-none" />
        </div>
      </div>
      {formDeadline && formLateDeadline && (
        <p className="text-xs text-muted-foreground">
          {t('federation.competitions.earlyDeadlineLabel')} {formDeadline} • {t('federation.competitions.lateDeadlineLabel')} {formLateDeadline}
        </p>
      )}

      <div>
        <Label>{t('federation.competitions.regulations')}</Label>
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
        {uploadingPdf && <p className="text-xs text-muted-foreground mt-1">{t('federation.competitions.uploading')}</p>}
      </div>
      <div
        className="flex items-center gap-3 p-3 border border-border cursor-pointer hover:bg-accent/50 transition-colors select-none"
        onClick={() => setFormCountsForRanking(!formCountsForRanking)}
      >
        <div className={`w-5 h-5 border-2 flex items-center justify-center ${formCountsForRanking ? 'bg-foreground border-foreground' : 'border-muted-foreground'}`}>
          {formCountsForRanking && <span className="text-background text-xs font-bold">✓</span>}
        </div>
        <div>
          <span className="text-sm font-medium">{t('federation.competitions.countsForRanking')}</span>
          <p className="text-xs text-muted-foreground">{t('federation.competitions.countsForRankingDesc')}</p>
        </div>
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
                <h1 className="text-lg font-semibold">{t('federation.competitions.mobileTitle')}</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Swords className="h-6 w-6" /> {t('federation.competitions.title')}
                </h1>
                <p className="text-sm text-muted-foreground">{t('federation.competitions.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setTemplatesDialogOpen(true)} className="rounded-none">
                  <Settings className="h-4 w-4 mr-2" /> {t('federation.competitions.manageCategories')}
                </Button>
                <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="h-4 w-4 mr-2" /> {t('federation.competitions.newCompetition')}
                </Button>
              </div>
            </div>

            {/* Mobile buttons */}
            <div className="lg:hidden mb-4 flex gap-2">
              <Button variant="outline" onClick={() => setTemplatesDialogOpen(true)} className="flex-1 rounded-none">
                <Settings className="h-4 w-4 mr-2" /> {t('federation.competitions.categories')}
              </Button>
              <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="flex-1 rounded-none bg-foreground text-background hover:bg-foreground/90">
                <Plus className="h-4 w-4 mr-2" /> {t('federation.competitions.newCompetition')}
              </Button>
            </div>

            {/* Competition Cards */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">{t('federation.common.loading')}</div>
            ) : competitions.length === 0 ? (
              <Card className="rounded-none">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Swords className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{t('federation.competitions.noCompetitions')}</p>
                  <p className="text-sm">{t('federation.competitions.noCompetitionsDesc')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {competitions.map(comp => (
                  <Card key={comp.id} className="rounded-none hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{comp.name}</CardTitle>
                          {(comp as any).counts_for_ranking && (
                            <Badge className="rounded-none bg-[#cb8954] text-white text-[9px] px-1.5 h-5 gap-1">
                              <Trophy className="h-3 w-3" /> Ranking
                            </Badge>
                          )}
                        </div>
                        {getStatusBadge(comp.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(comp.competition_date), 'd MMMM yyyy', { locale: dateLocale })}</span>
                      </div>
                      {comp.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {comp.location_url ? (
                            <a href={comp.location_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                              {comp.location}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span>{comp.location}</span>
                          )}
                        </div>
                      )}
                      {(comp.registration_deadline || comp.late_registration_deadline) && (
                        <div className="space-y-0.5">
                          {comp.registration_deadline && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {t('federation.competitions.earlyDeadlineLabel')}: {format(new Date(comp.registration_deadline), 'd MMM yyyy', { locale: dateLocale })}
                            </div>
                          )}
                          {comp.late_registration_deadline && (
                            <div className="flex items-center gap-1 text-xs text-[#cb8954]">
                              <Clock className="h-3 w-3" />
                              {t('federation.competitions.lateDeadlineLabel')}: {format(new Date(comp.late_registration_deadline), 'd MMM yyyy', { locale: dateLocale })}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Swords className="h-3 w-3" /> {comp.categories_count} {t('federation.competitions.categoriesCount')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {comp.registrations_count} {t('federation.competitions.registrationsCount')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 pt-2 border-t">
                        <Button variant="outline" size="sm" className="rounded-none flex-1 min-w-[80px] text-xs" onClick={() => {
                          setSelectedCompetition(comp);
                          setCategoriesDialogOpen(true);
                        }}>
                          <Swords className="h-3 w-3 mr-1 shrink-0" />
                          <span className="hidden sm:inline">{t('federation.competitions.categories')}</span>
                          <span className="sm:hidden">{t('federation.competitions.categoriesShort')}</span>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-none flex-1 min-w-[80px] text-xs" onClick={() => {
                          setSelectedCompetition(comp);
                          setRegistrationsDialogOpen(true);
                        }}>
                          <Users className="h-3 w-3 mr-1 shrink-0" />
                          <span className="hidden sm:inline">{t('federation.competitions.registrations')}</span>
                          <span className="sm:hidden">{t('federation.competitions.registrationsShort')}</span>
                        </Button>
                        <div className="flex items-center gap-1">
                          {comp.regulations_pdf_url && (
                            <a href={comp.regulations_pdf_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="rounded-none h-8 w-8 p-0">
                                <FileText className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                          <Button variant="outline" size="sm" className="rounded-none h-8 w-8 p-0" onClick={() => openEditDialog(comp)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-none h-8 w-8 p-0 text-destructive" onClick={() => {
                            setCompetitionToDelete(comp.id);
                            setDeleteDialogOpen(true);
                          }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-none" onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.pac-container')) {
              e.preventDefault();
            }
          }} onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.pac-container')) {
              e.preventDefault();
            }
          }}>
          <DialogHeader>
            <DialogTitle>{t('federation.competitions.createDialog')}</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-none">{t('federation.common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={saving} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
              {saving ? t('federation.competitions.saving') : t('federation.competitions.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-none" onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.pac-container')) {
              e.preventDefault();
            }
          }} onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.pac-container')) {
              e.preventDefault();
            }
          }}>
          <DialogHeader>
            <DialogTitle>{t('federation.competitions.editDialog')}</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-none">{t('federation.common.cancel')}</Button>
            <Button onClick={handleEdit} disabled={saving} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
              {saving ? t('federation.competitions.saving') : t('federation.competitions.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('federation.competitions.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('federation.competitions.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t('federation.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">
              {t('federation.competitions.delete')}
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
