import { SubscriptionManagement } from "@/components/subscriptions/SubscriptionManagement";

export default function SubscriptionsWidget() {
  return (
    <div className="min-h-screen bg-gray-50 w-full p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Συνδρομών</h1>
        <p className="text-gray-600">Συνδρομές</p>
      </div>
    
      <SubscriptionManagement />
    </div>
  );
}
