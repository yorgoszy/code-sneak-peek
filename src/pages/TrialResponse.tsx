import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TrialResponse: React.FC = () => {
  const [params] = useSearchParams();
  const state = params.get('state') || 'info';
  const name = params.get('name') || '';
  const message = params.get('message') || '';

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
