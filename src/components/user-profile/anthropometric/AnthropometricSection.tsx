import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnthropometricNewRecord } from "./AnthropometricNewRecord";
import { AnthropometricHistory } from "./AnthropometricHistory";

interface AnthropometricSectionProps {
  userId: string;
}

export const AnthropometricSection: React.FC<AnthropometricSectionProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState("new");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRecordCreated = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab("history");
  };

  return (
    <Card className="rounded-none w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Σωματομετρικά</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="new" className="rounded-none">
              Νέα Καταγραφή
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-none">
              Ιστορικό
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            <AnthropometricNewRecord userId={userId} onRecordCreated={handleRecordCreated} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <AnthropometricHistory userId={userId} refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
