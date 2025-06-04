
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, Minimize2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuadrantData {
  id: string;
  title: string;
  content: string;
}

const RunMode = () => {
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);
  const [quadrants, setQuadrants] = useState<QuadrantData[]>([
    { id: '1', title: 'Τεταρτημόριο 1', content: 'Περιεχόμενο 1' },
    { id: '2', title: 'Τεταρτημόριο 2', content: 'Περιεχόμενο 2' },
    { id: '3', title: 'Τεταρτημόριο 3', content: 'Περιεχόμενο 3' },
    { id: '4', title: 'Τεταρτημόριο 4', content: 'Περιεχόμενο 4' },
  ]);

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleAddQuadrant = () => {
    const newId = (quadrants.length + 1).toString();
    const newQuadrant: QuadrantData = {
      id: newId,
      title: `Τεταρτημόριο ${newId}`,
      content: `Περιεχόμενο ${newId}`
    };
    setQuadrants([...quadrants, newQuadrant]);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-black text-white p-4 rounded-none shadow-lg min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Run Mode</h3>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="h-6 w-6 p-0 text-white hover:bg-gray-700 rounded-none"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 text-white hover:bg-gray-700 rounded-none"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-300">Ελαχιστοποιημένο</p>
        </div>
      </div>
    );
  }

  const getGridCols = () => {
    if (quadrants.length <= 4) {
      return 'grid-cols-2';
    } else if (quadrants.length <= 6) {
      return 'grid-cols-3';
    } else {
      return 'grid-cols-4';
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Run Mode</h1>
        <div className="flex space-x-2">
          <Button
            onClick={handleAddQuadrant}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-700 rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Προσθήκη Τεταρτημορίου
          </Button>
          <Button
            onClick={handleMinimize}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-700 rounded-none"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-700 rounded-none"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quadrants Grid */}
      <div className={`flex-1 p-4 h-[calc(100vh-80px)] overflow-auto`}>
        <div className={`grid ${getGridCols()} gap-4 h-full`}>
          {quadrants.map((quadrant) => (
            <div
              key={quadrant.id}
              className="bg-gray-900 border border-gray-700 rounded-none p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{quadrant.title}</h2>
                <Button
                  onClick={() => setQuadrants(quadrants.filter(q => q.id !== quadrant.id))}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-gray-700 rounded-none"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1 bg-gray-800 p-4 rounded-none">
                <p className="text-gray-300">{quadrant.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RunMode;
