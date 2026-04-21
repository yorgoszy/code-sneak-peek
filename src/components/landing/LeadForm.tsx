import React, { useState } from 'react';
import { Loader2, CheckCircle2, User, Phone, Mail, MessageSquare, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const SERVICES: Array<{ value: string; el: string; en: string }> = [
  { value: 'hyperkids', el: 'Hyperkids (4-12 ετών)', en: 'Hyperkids (ages 4-12)' },
  { value: 'hypergym', el: 'HyperGym / Open Gym', en: 'HyperGym / Open Gym' },
  { value: 'muaythai', el: 'Muay Thai / HyperAthletes', en: 'Muay Thai / HyperAthletes' },
  { value: 'elite', el: 'Elite Training (1-on-1)', en: 'Elite Training (1-on-1)' },
  { value: 'live', el: 'Live Online Program', en: 'Live Online Program' },
  { value: 'other', el: 'Άλλο / Δεν είμαι σίγουρος/η', en: 'Other / Not sure' },
];

interface LeadFormProps {
  language?: 'el' | 'en';
  sessionId: string;
  interest?: string;
  onSubmitted?: () => void;
}

const T = {
  el: {
    title: 'Άσε τα στοιχεία σου',
    subtitle: 'Θα σε καλέσει η ομάδα μας — χωρίς εγγραφή.',
    name: 'Όνομα',
    phone: 'Τηλέφωνο',
    email: 'Email (προαιρετικό)',
    message: 'Μήνυμα (προαιρετικό)',
    service: 'Υπηρεσία που σε ενδιαφέρει (προαιρετικό)',
    submit: 'Αποστολή',
    sending: 'Αποστολή...',
    success: 'Ευχαριστούμε! Θα επικοινωνήσουμε σύντομα.',
    nameRequired: 'Το όνομα είναι υποχρεωτικό',
    contactRequired: 'Συμπλήρωσε τηλέφωνο ή email',
    error: 'Κάτι πήγε στραβά, δοκίμασε ξανά.',
  },
  en: {
    title: 'Leave your details',
    subtitle: "Our team will contact you — no signup needed.",
    name: 'Name',
    phone: 'Phone',
    email: 'Email (optional)',
    message: 'Message (optional)',
    service: 'Service of interest (optional)',
    submit: 'Send',
    sending: 'Sending...',
    success: "Thanks! We'll be in touch soon.",
    nameRequired: 'Name is required',
    contactRequired: 'Phone or email required',
    error: 'Something went wrong, please try again.',
  },
};

export const LeadForm: React.FC<LeadFormProps> = ({
  language = 'el',
  sessionId,
  interest,
  onSubmitted,
}) => {
  const t = T[language];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [service, setService] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError(t.nameRequired);
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError(t.contactRequired);
      return;
    }

    setLoading(true);
    try {
      const { error: fnError } = await supabase.functions.invoke('submit-landing-lead', {
        body: {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          interest: service || interest,
          sessionId,
          language,
          userAgent: navigator.userAgent,
        },
      });

      if (fnError) throw fnError;
      setSuccess(true);
      onSubmitted?.();
    } catch (err) {
      console.error('Lead submit error:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="border border-[#00ffba] bg-[#00ffba]/5 p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#00ffba] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-900">{t.success}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-200 bg-white p-2 space-y-1.5"
    >
      <p className="text-xs font-semibold text-gray-900 leading-tight">{t.title}</p>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="relative">
          <User className="w-3 h-3 text-gray-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.name + ' *'}
            className="rounded-none h-8 text-xs pl-6"
            disabled={loading}
            maxLength={100}
          />
        </div>
        <div className="relative">
          <Phone className="w-3 h-3 text-gray-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.phone}
            type="tel"
            className="rounded-none h-8 text-xs pl-6"
            disabled={loading}
            maxLength={30}
          />
        </div>
      </div>

      <div className="relative">
        <Mail className="w-3 h-3 text-gray-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          type="email"
          className="rounded-none h-8 text-xs pl-6"
          disabled={loading}
          maxLength={255}
        />
      </div>

      <div className="relative">
        <Dumbbell className="w-3 h-3 text-gray-400 absolute left-1.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
        <Select value={service} onValueChange={setService} disabled={loading}>
          <SelectTrigger className="rounded-none h-8 text-xs pl-6">
            <SelectValue placeholder={t.service} />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {SERVICES.map((s) => (
              <SelectItem key={s.value} value={s.value} className="rounded-none text-xs">
                {language === 'en' ? s.en : s.el}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-8 text-xs font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            {t.sending}
          </>
        ) : (
          t.submit
        )}
      </Button>
    </form>
  );
};
