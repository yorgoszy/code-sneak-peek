import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const SchoolNotes = () => {
  return (
    <div className="space-y-4">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Σχολικές Σημειώσεις
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Εδώ θα εμφανίζονται οι σχολικές σημειώσεις για το παιδί σας.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
