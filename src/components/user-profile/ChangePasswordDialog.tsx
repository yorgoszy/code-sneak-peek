
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Key } from "lucide-react";

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  isOpen,
  onClose
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Σφάλμα",
        description: "Οι κωδικοί δεν ταιριάζουν",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Σφάλμα",
        description: "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Πρώτα επαληθεύουμε τον τρέχοντα κωδικό
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.email) {
        throw new Error("Δεν βρέθηκε χρήστης");
      }

      // Δοκιμάζουμε να συνδεθούμε με τον τρέχοντα κωδικό για επαλήθευση
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Σφάλμα",
          description: "Ο τρέχων κωδικός είναι λανθασμένος",
          variant: "destructive",
        });
        return;
      }

      // Αλλάζουμε τον κωδικό
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία!",
        description: "Ο κωδικός σας άλλαξε επιτυχώς",
      });

      // Καθαρίζουμε τα πεδία και κλείνουμε το dialog
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();

    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: "Σφάλμα",
        description: error.message || "Παρουσιάστηκε σφάλμα κατά την αλλαγή κωδικού",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Αλλαγή Κωδικού
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Τρέχων Κωδικός</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Νέος Κωδικός</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Επιβεβαίωση Νέου Κωδικού</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-none"
              disabled={loading}
            >
              Ακύρωση
            </Button>
            <Button
              type="submit"
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              disabled={loading}
            >
              {loading ? "Αλλαγή..." : "Αλλαγή Κωδικού"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
