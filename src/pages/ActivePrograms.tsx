
import React, { useState } from 'react';
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

const ActivePrograms = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  return (
    <DashboardContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-8 w-8 text-[#00ffba]" />
            Ενεργά Προγράμματα
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-1 rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">Ημερολόγιο Προπονήσεων</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-none w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                  month: "space-y-4 w-full flex-1",
                  table: "w-full h-full border-collapse space-y-1",
                  head_row: "",
                  row: "w-full mt-2",
                }}
              />
              
              {selectedDate && (
                <div className="mt-4 p-3 bg-gray-50 rounded-none">
                  <p className="text-sm text-gray-600">
                    Επιλεγμένη ημερομηνία: {selectedDate.toLocaleDateString('el-GR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Programs for Selected Date */}
          <Card className="lg:col-span-2 rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">
                Προγράμματα για {selectedDate?.toLocaleDateString('el-GR')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Επιλέξτε μια ημερομηνία για να δείτε τα προγράμματα</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardContainer>
  );
};

export default ActivePrograms;
