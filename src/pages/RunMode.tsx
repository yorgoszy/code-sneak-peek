
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { RunModeQuarter } from "@/components/run-mode/RunModeQuarter";

const RunMode = () => {
  const [quarters, setQuarters] = useState<number[]>([1, 2, 3, 4]);
  const { programs, loading } = useActivePrograms(true);
  
  // Φιλτράρουμε τα προγράμματα για σήμερα
  const todayString = format(new Date(), 'yyyy-MM-dd');
  const todaysPrograms = programs.filter(program => 
    program.training_dates && Array.isArray(program.training_dates) && 
    program.training_dates.includes(todayString)
  );

  const addQuarter = () => {
    setQuarters(prev => [...prev, Math.max(...prev) + 1]);
  };

  const removeQuarter = (quarterId: number) => {
    if (quarters.length > 1) {
      setQuarters(prev => prev.filter(id => id !== quarterId));
    }
  };

  const exitRunMode = () => {
    window.history.back();
  };

  // Δυναμική λογική για το grid layout
  const getGridClasses = (quarterCount: number) => {
    if (quarterCount === 1) return 'grid-cols-1';
    if (quarterCount === 2) return 'grid-cols-2';
    if (quarterCount === 3) return 'grid-cols-3';
    if (quarterCount === 4) return 'grid-cols-2 grid-rows-2';
    if (quarterCount <= 6) return 'grid-cols-3 grid-rows-2';
    if (quarterCount <= 8) return 'grid-cols-4 grid-rows-2';
    if (quarterCount <= 9) return 'grid-cols-3 grid-rows-3';
    return 'grid-cols-4 grid-rows-3';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Φόρτωση Run Mode...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#00ffba]">
          Run Mode - {format(new Date(), 'dd/MM/yyyy')}
        </h1>
        <div className="flex items-center space-x-4">
          <Button
            onClick={addQuarter}
            variant="outline"
            size="sm"
            className="bg-transparent border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba] hover:text-black rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Προσθήκη Τεταρτημορίου
          </Button>
          <Button
            onClick={exitRunMode}
            variant="outline"
            size="sm"
            className="bg-transparent border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-none"
          >
            <X className="h-4 w-4 mr-2" />
            Έξοδος
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="pt-20 p-4 h-screen">
        <div className={`grid gap-4 h-full ${getGridClasses(quarters.length)}`}>
          {quarters.map((quarterId) => (
            <RunModeQuarter
              key={quarterId}
              quarterId={quarterId}
              programs={todaysPrograms}
              onRemove={() => removeQuarter(quarterId)}
              canRemove={quarters.length > 1}
            />
          ))}
        </div>
      </div>

      {todaysPrograms.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl text-gray-400 mb-2">Δεν υπάρχουν προγράμματα για σήμερα</h2>
            <p className="text-gray-600">Προσθέστε προγράμματα στο ημερολόγιο για να χρησιμοποιήσετε το Run Mode</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunMode;
