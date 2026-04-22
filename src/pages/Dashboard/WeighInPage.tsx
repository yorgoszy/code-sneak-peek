import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FederationSidebar } from '@/components/FederationSidebar';
import { CoachSidebar } from '@/components/CoachSidebar';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Menu, Search, Scale, Stethoscope, Check, X, AlertTriangle, RefreshCw, Play, Square, Clock, Calendar, Save, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizeGreekText } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

interface Registration {
  id: string;
  athlete_id: string;
  club_id: string;
  category_id: string;
  competition_id: string;
  is_paid: boolean | null;
  weigh_in_status: string | null;
  weigh_in_weight: number | null;
  athlete: { name: string; photo_url: string | null; avatar_url: string | null; email: string } | null;
  club: { name: string } | null;
  category: { name: string; min_weight: number | null; max_weight: number | null; gender: string | null } | null;
}

interface Competition {
  id: string;
  name: string;
  competition_date: string;
  end_date?: string | null;
  competition_flow?: string;
  weigh_in_active?: boolean;
  weigh_in_date?: string | null;
  weigh_in_start_time?: string | null;
  weigh_in_end_time?: string | null;
  weigh_in_started_at?: string | null;
  weigh_in_ended_at?: string | null;
}

interface WeighInPageProps {
  embedded?: boolean;
}

export default function WeighInPage({ embedded = false }: WeighInPageProps) {
  const { t } = useTranslation();
  const { competitionId } = useParams();
  const { role, isLoading: roleLoading } = useRoleCheck();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (competitionId) {
      fetchData();
    }
  }, [competitionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: compData, error: compError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (compError) throw compError;
      setCompetition(compData);

      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select(`
          *,
          athlete:profiles!registrations_athlete_id_fkey(name, photo_url, avatar_url, email),
          club:clubs(name),
          category:categories(name, min_weight, max_weight, gender)
        `)
        .eq('competition_id', competitionId);

      if (regError) throw regError;
      setRegistrations(regData as Registration[]);
    } catch (error) {
      console.error('Error fetching weigh-in data:', error);
      toast.error(t('error_loading_data'));
    } finally {
      setLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = normalizeGreekText(reg.athlete?.name || '').includes(normalizeGreekText(searchTerm));
    const matchesCategory = selectedCategory === 'all' || reg.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(registrations.map(r => r.category_id)))
    .map(id => registrations.find(r => r.category_id === id)?.category)
    .filter(Boolean);

  const SidebarComponent = role === 'federation' ? FederationSidebar : CoachSidebar;

  if (loading) return <div className="p-8 text-center">{t('loading')}</div>;

  return (
    <SidebarProvider defaultOpen={!embedded}>
      {!embedded && <SidebarComponent />}
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{competition?.name} - {t('weigh_in')}</h1>
          {!embedded && (
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
          )}
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search_athlete')}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('select_category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_categories')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat?.name} value={registrations.find(r => r.category?.name === cat?.name)?.category_id || ''}>
                  {cat?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('athlete')}</TableHead>
                <TableHead>{t('club')}</TableHead>
                <TableHead>{t('category')}</TableHead>
                <TableHead>{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reg.athlete?.avatar_url || ''} />
                      <AvatarFallback>{reg.athlete?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {reg.athlete?.name}
                  </TableCell>
                  <TableCell>{reg.club?.name}</TableCell>
                  <TableCell>{reg.category?.name}</TableCell>
                  <TableCell>
                    <Badge variant={reg.weigh_in_status === 'passed' ? 'default' : 'secondary'}>
                      {reg.weigh_in_status || t('pending')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </SidebarProvider>
  );
}
