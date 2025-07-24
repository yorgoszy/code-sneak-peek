
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Οι κωδικοί δεν ταιριάζουν");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες");
      return;
    }

    setLoading(true);

    try {
      console.log('🔑 Attempting password change...');
      
      // Αλλαγή κωδικού χωρίς επαλήθευση του παλιού
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        throw error;
      }

      console.log('✅ Password updated successfully');
      
      toast.success("Ο κωδικός σας άλλαξε επιτυχώς");

      // Καθαρίζουμε τα πεδία και κλείνουμε το dialog
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();

    } catch (error: any) {
      console.error('❌ Password change error:', error);
      toast.error(error.message || "Παρουσιάστηκε σφάλμα κατά την αλλαγή κωδικού");
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
            <Label htmlFor="new-password">Νέος Κωδικός</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-none"
              placeholder="Εισάγετε τον νέο κωδικό"
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
              placeholder="Επιβεβαιώστε τον νέο κωδικό"
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
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? "Αλλαγή..." : "Αλλαγή Κωδικού"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
