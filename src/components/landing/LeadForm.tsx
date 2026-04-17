import React, { useState } from 'react';
import { Loader2, CheckCircle2, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

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
          interest,
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
      className="border border-gray-200 bg-white p-3 space-y-2"
    >
      <div>
        <p className="text-sm font-semibold text-gray-900">{t.title}</p>
        <p className="text-[11px] text-gray-500">{t.subtitle}</p>
      </div>

      <div className="relative">
        <User className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.name + ' *'}
          className="rounded-none h-9 text-sm pl-7"
          disabled={loading}
          maxLength={100}
        />
      </div>

      <div className="relative">
        <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t.phone}
          type="tel"
          className="rounded-none h-9 text-sm pl-7"
          disabled={loading}
          maxLength={30}
        />
      </div>

      <div className="relative">
        <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          type="email"
          className="rounded-none h-9 text-sm pl-7"
          disabled={loading}
          maxLength={255}
        />
      </div>

      <div className="relative">
        <MessageSquare className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2.5" />
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.message}
          rows={2}
          className="rounded-none text-sm pl-7 resize-none min-h-[60px]"
          disabled={loading}
          maxLength={1000}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-9"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t.sending}
          </>
        ) : (
          t.submit
        )}
      </Button>
    </form>
  );
};
