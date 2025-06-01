
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserProfilePaymentsProps {
  payments: any[];
}

export const UserProfilePayments = ({ payments }: UserProfilePaymentsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ιστορικό Πληρωμών</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Δεν βρέθηκαν πληρωμές
          </p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="border p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">€{payment.amount}</h4>
                    <p className="text-sm text-gray-600">{payment.payment_method}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(payment.payment_date)}
                    </p>
                  </div>
                  <Badge variant="outline">{payment.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
