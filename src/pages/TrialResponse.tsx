import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FN_URL = 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/trial-request-action';

interface TrialDetails {
  name?: string;
  email?: string;
  phone?: string | null;
  section?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  message?: string | null;
  status?: string;
}

const TrialResponse: React.FC = () => {
  const [params] = useSearchParams();
  const initialState = params.get('state') || 'info';
  const nameParam = params.get('name') || '';
  const messageParam = params.get('message') || '';
  const id = params.get('id');
  const token = params.get('token');
  const action = params.get('action');

  const [state, setState] = useState(initialState);
  const [message, setMessage] = useState(messageParam);
  const [details, setDetails] = useState<TrialDetails | null>(null);
  const [loading, setLoading] = useState(initialState === 'confirm');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialState !== 'confirm' || !id || !token) return;
    (async () => {
      try {
        const res = await fetch(FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, token, action: 'fetch' }),
        });
        const data = await res.json();
        if (data.request) {
          setDetails(data.request);
          if (data.request.status && data.request.status !== 'pending') {
            setState(data.request.status === 'approved' ? 'approved' : 'rejected');
            setMessage(
              `Το αίτημα έχει ήδη ${data.request.status === 'approved' ? 'εγκριθεί' : 'απορριφθεί'}.`
            );
          }
        } else {
          setState('info');
          setMessage(data.error || 'Το αίτημα δεν βρέθηκε.');
        }
      } catch (e) {
        setState('info');
        setMessage('Σφάλμα φόρτωσης αιτήματος.');
      } finally {
        setLoading(false);
      }
    })();
  }, [initialState, id, token]);

  const submit = async (finalAction: 'approve' | 'reject') => {
    if (!id || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token, action: finalAction }),
      });
      const data = await res.json();
      setState(data.state || 'info');
      setMessage(data.message || data.error || '');
      if (data.request) setDetails(data.request);
    } catch (e) {
      setState('info');
      setMessage('Σφάλμα κατά την καταχώρηση.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (state === 'confirm' && details) {
    const dateStr = details.preferred_date
      ? new Date(details.preferred_date).toLocaleDateString('el-GR')
      : '—';
    const isApprove = action !== 'reject';
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full border-2 border-black p-8 space-y-4">
          <h1 className="text-2xl font-bold text-black text-center">
            {isApprove ? 'Επιβεβαίωση αποδοχής' : 'Επιβεβαίωση απόρριψης'}
          </h1>
          <div className="text-sm text-gray-800 space-y-1 border-t border-b border-gray-200 py-4">
            <p><b>Όνομα:</b> {details.name}</p>
            <p><b>Email:</b> {details.email}</p>
            {details.phone && <p><b>Τηλέφωνο:</b> {details.phone}</p>}
            <p><b>Τμήμα:</b> {details.section || '—'}</p>
            <p><b>Ημερομηνία:</b> {dateStr} {details.preferred_time || ''}</p>
            {details.message && <p><b>Μήνυμα:</b> {details.message}</p>}
          </div>
          <p className="text-sm text-gray-600 text-center">
            {isApprove
              ? 'Η κράτηση στο online booking θα δημιουργηθεί μόνο αφού πατήσεις Αποδοχή.'
              : 'Ο χρήστης θα ενημερωθεί ότι το αίτημα απορρίφθηκε.'}
          </p>
          <div className="flex gap-2">
            <Button
              className="rounded-none flex-1"
              disabled={submitting}
              onClick={() => submit(isApprove ? 'approve' : 'reject')}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isApprove ? 'Αποδοχή' : 'Απόρριψη'}
            </Button>
            <Button
              variant="outline"
              className="rounded-none flex-1"
              disabled={submitting}
              onClick={() => submit(isApprove ? 'reject' : 'approve')}
            >
              {isApprove ? 'Απόρριψη' : 'Αποδοχή'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const name = details?.name || nameParam;
  const config = {
    approved: {
      icon: <CheckCircle className="h-12 w-12 text-[#00ffba]" />,
      title: 'Εγκρίθηκε',
      text: message || `Το αίτημα${name ? ` του/της ${name}` : ''} εγκρίθηκε, ο χρήστης ειδοποιήθηκε και η κράτηση καταχωρήθηκε.`,
    },
    rejected: {
      icon: <XCircle className="h-12 w-12 text-gray-500" />,
      title: 'Απορρίφθηκε',
      text: message || `Το αίτημα${name ? ` του/της ${name}` : ''} απορρίφθηκε και ο χρήστης ειδοποιήθηκε.`,
    },
    info: {
      icon: <Info className="h-12 w-12 text-gray-500" />,
      title: 'Ενημέρωση',
      text: message || 'Το αίτημα έχει ήδη απαντηθεί.',
    },
  }[state as 'approved' | 'rejected' | 'info'] ?? {
    icon: <Info className="h-12 w-12 text-gray-500" />,
    title: 'Ενημέρωση',
    text: message,
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full border-2 border-black p-8 text-center space-y-4">
        <div className="flex justify-center">{config.icon}</div>
        <h1 className="text-2xl font-bold text-black">{config.title}</h1>
        <p className="text-gray-700">{config.text}</p>
        <Link to="/dashboard/online-booking">
          <Button className="rounded-none w-full">Προβολή κρατήσεων</Button>
        </Link>
      </div>
    </div>
  );
};

export default TrialResponse;
