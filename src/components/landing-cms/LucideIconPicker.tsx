import React, { useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';

// Build searchable list of icon names (PascalCase) once.
const ALL_ICON_NAMES: string[] = Object.keys(Icons).filter((k) => {
  if (!/^[A-Z]/.test(k)) return false;
  if (k === 'Icon' || k === 'createLucideIcon' || k === 'LucideIcon') return false;
  if (k.endsWith('Icon')) return false; // duplicate aliases like ActivityIcon
  const v = (Icons as any)[k];
  return typeof v === 'object' || typeof v === 'function';
});

export function getLucideIcon(name?: string | null): React.ComponentType<any> | null {
  if (!name) return null;
  const C = (Icons as any)[name];
  return (typeof C === 'function' || (typeof C === 'object' && C)) ? C : null;
}

interface Props {
  value: string | null | undefined;
  onChange: (name: string | null) => void;
  label?: string;
  color?: string;
}

export const LucideIconPicker: React.FC<Props> = ({ value, onChange, label = 'Εικονίδιο', color }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_ICON_NAMES.slice(0, 240);
    return ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 240);
  }, [query]);

  const Current = getLucideIcon(value);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="rounded-none gap-2">
              {Current ? <Current className="w-4 h-4" style={{ color }} /> : <span className="text-xs text-muted-foreground">Δεν επιλέχθηκε</span>}
              <span className="text-xs">{value || 'Επιλογή...'}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-3 rounded-none" align="start">
            <Input
              autoFocus
              placeholder="Αναζήτηση εικονιδίου..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-none mb-2"
            />
            <div className="grid grid-cols-8 gap-1 max-h-72 overflow-y-auto">
              {filtered.map((name) => {
                const C = (Icons as any)[name];
                const selected = name === value;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => { onChange(name); setOpen(false); }}
                    className={`flex items-center justify-center w-10 h-10 border ${
                      selected ? 'border-foreground bg-foreground/5' : 'border-transparent hover:border-border'
                    }`}
                  >
                    <C className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="text-xs text-muted-foreground p-3">Κανένα αποτέλεσμα</div>
            )}
          </PopoverContent>
        </Popover>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="rounded-none" onClick={() => onChange(null)}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
