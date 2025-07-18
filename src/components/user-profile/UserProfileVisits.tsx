import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, User, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfileVisitsProps {
  visits: any[];
  user: any;
}

export const UserProfileVisits = ({ visits, user }: UserProfileVisitsProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Ιστορικό Επισκέψεων</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length > 0 ? (
            <div className="space-y-4">
              {visits.map((visit) => (
                <div key={visit.id} className="border border-gray-200 rounded-none p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {new Date(visit.visit_date).toLocaleDateString('el-GR')}
                      </span>
                      <Clock className="h-4 w-4 text-gray-500 ml-4" />
                      <span className="text-sm text-gray-600">
                        {visit.visit_time}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-none text-xs ${
                      visit.visit_type === 'auto' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {visit.visit_type === 'auto' ? 'Αυτόματη' : 'Χειροκίνητη'}
                    </span>
                  </div>
                  
                  {visit.location && (
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{visit.location}</span>
                    </div>
                  )}
                  
                  {visit.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">{visit.notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Δημιουργήθηκε: {new Date(visit.created_at).toLocaleString('el-GR')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Δεν υπάρχουν επισκέψεις</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Πακέτα Επισκέψεων */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Πακέτα Επισκέψεων</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <p>Σύντομα θα εμφανίζονται εδώ τα πακέτα επισκέψεων</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};