import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

const normalize = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface EkourosClub { id: string; name: string; name_normalized: string | null; }
interface EkourosSport { id: string; name: string; name_normalized: string | null; }

export const useEkourosDirectory = () => {
  const [clubs, setClubs] = useState<EkourosClub[]>([]);
  const [sports, setSports] = useState<EkourosSport[]>([]);

  useEffect(() => {
    (async () => {
      const PAGE = 1000;
      let from = 0;
      const all: EkourosClub[] = [];
      // paginate to bypass 1000-row limit
      while (true) {
        const { data, error } = await supabase
          .from('ekouros_clubs')
          .select('id, name, name_normalized')
          .order('name')
          .range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      setClubs(all);

      const { data: s } = await supabase
        .from('ekouros_sports')
        .select('id, name, name_normalized')
        .order('name');
      setSports(s || []);
    })();
  }, []);

  const searchClubs = useMemo(() => (q: string, limit = 50) => {
    const nq = normalize(q);
    if (!nq) return [];
    return clubs
      .filter((c) => (c.name_normalized || normalize(c.name)).includes(nq))
      .slice(0, limit);
  }, [clubs]);

  const searchSports = useMemo(() => (q: string, limit = 50) => {
    const nq = normalize(q);
    if (!nq) return [];
    return sports
      .filter((s) => (s.name_normalized || normalize(s.name)).includes(nq))
      .slice(0, limit);
  }, [sports]);

  return { clubs, sports, searchClubs, searchSports };
};
