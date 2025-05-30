
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FunctionalTestResultsProps {
  data: {
    fms_score?: number;
    previous_fms_score?: number;
    muscles_need_stretching?: string[];
    muscles_need_strengthening?: string[];
    sit_and_reach?: number;
    shoulder_mobility_left?: number;
    shoulder_mobility_right?: number;
    flamingo_balance?: number;
    posture_assessment?: string;
  };
}

export const FunctionalTestResults = ({ data }: FunctionalTestResultsProps) => {
  const fmsChange = data.fms_score && data.previous_fms_score 
    ? data.fms_score - data.previous_fms_score 
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* FMS Score */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">FMS Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-center mb-2">
            {data.fms_score || 'N/A'}
          </div>
          {fmsChange !== null && (
            <div className="text-center">
              <Badge 
                variant={fmsChange >= 0 ? "default" : "destructive"}
                className="rounded-none"
              >
                {fmsChange >= 0 ? '+' : ''}{fmsChange} από το προηγούμενο
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Μύες που χρειάζονται διάταση */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Μύες που χρειάζονται διάταση</CardTitle>
        </CardHeader>
        <CardContent>
          {data.muscles_need_stretching && data.muscles_need_stretching.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.muscles_need_stretching.map((muscle, index) => (
                <Badge key={index} variant="outline" className="rounded-none">
                  {muscle}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Δεν υπάρχουν καταγραφές</p>
          )}
        </CardContent>
      </Card>

      {/* Μύες που χρειάζονται ενδυνάμωση */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Μύες που χρειάζονται ενδυνάμωση</CardTitle>
        </CardHeader>
        <CardContent>
          {data.muscles_need_strengthening && data.muscles_need_strengthening.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.muscles_need_strengthening.map((muscle, index) => (
                <Badge key={index} variant="outline" className="rounded-none bg-orange-100">
                  {muscle}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Δεν υπάρχουν καταγραφές</p>
          )}
        </CardContent>
      </Card>

      {/* Άλλα αποτελέσματα */}
      <Card className="rounded-none col-span-full">
        <CardHeader>
          <CardTitle className="text-lg">Άλλα Αποτελέσματα</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.sit_and_reach && (
              <div className="text-center">
                <div className="text-2xl font-bold">{data.sit_and_reach}</div>
                <div className="text-sm text-gray-600">Sit & Reach (cm)</div>
              </div>
            )}
            {data.shoulder_mobility_left && (
              <div className="text-center">
                <div className="text-2xl font-bold">{data.shoulder_mobility_left}</div>
                <div className="text-sm text-gray-600">Κινητικότητα Ώμου Α (cm)</div>
              </div>
            )}
            {data.shoulder_mobility_right && (
              <div className="text-center">
                <div className="text-2xl font-bold">{data.shoulder_mobility_right}</div>
                <div className="text-sm text-gray-600">Κινητικότητα Ώμου Δ (cm)</div>
              </div>
            )}
            {data.flamingo_balance && (
              <div className="text-center">
                <div className="text-2xl font-bold">{data.flamingo_balance}</div>
                <div className="text-sm text-gray-600">Flamingo Balance (sec)</div>
              </div>
            )}
          </div>
          {data.posture_assessment && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Αξιολόγηση Στάσης:</h4>
              <p className="text-gray-700">{data.posture_assessment}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
