import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";

const CoachShopContent = () => {
  const { coachId } = useCoachContext();
  
  if (!coachId) return null;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Coach Shop</h2>
        <p className="text-muted-foreground">Σύντομα διαθέσιμο...</p>
      </div>
    </div>
  );
};

const CoachShop = () => {
  return (
    <CoachLayout title="Shop" ContentComponent={CoachShopContent} />
  );
};

export default CoachShop;
