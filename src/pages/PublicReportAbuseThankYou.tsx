import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield } from "lucide-react";

export default function PublicReportAbuseThankYou() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="rounded-none border-2 max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-foreground" />
          <h1 className="text-2xl font-bold">Σας ευχαριστούμε</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Η καταγγελία σας υποβλήθηκε με επιτυχία και προωθήθηκε στις αρμόδιες ομοσπονδίες
            καθώς και στη διοίκηση του HyperKids για άμεση διερεύνηση.
          </p>
          <div className="bg-muted p-4 text-xs text-left space-y-1">
            <p className="flex items-center gap-2 font-semibold"><Shield className="h-4 w-4" /> Εμπιστευτικότητα</p>
            <p className="text-muted-foreground">
              Τα στοιχεία σας προστατεύονται και δεν θα κοινοποιηθούν δημόσια. Μόνο εξουσιοδοτημένα
              πρόσωπα έχουν πρόσβαση στην αναφορά σας.
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="rounded-none w-full">Επιστροφή στην αρχική</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
