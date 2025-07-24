import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserCheck, Group } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  subscription_status?: string;
}

interface GroupData {
  id: string;
  name: string;
  description?: string;
}

interface OfferPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
}

export const OfferPreviewDialog: React.FC<OfferPreviewDialogProps> = ({
  isOpen,
  onClose,
  offer
}) => {
  const [loading, setLoading] = useState(false);
  const [targetUsers, setTargetUsers] = useState<User[]>([]);
  const [targetGroups, setTargetGroups] = useState<GroupData[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen && offer) {
      fetchTargetData();
    }
  }, [isOpen, offer]);

  const fetchTargetData = async () => {
    if (!offer) return;
    
    setLoading(true);
    try {
      if (offer.visibility === 'all') {
        // Φόρτωση όλων των χρηστών
        const { data: usersData, error: usersError } = await supabase
          .from('app_users')
          .select('id, name, email, subscription_status')
          .order('name');
        
        if (usersError) throw usersError;
        setAllUsers(usersData || []);
      } else if (offer.visibility === 'individual' || offer.visibility === 'selected') {
        // Φόρτωση συγκεκριμένων χρηστών
        if (offer.target_users && offer.target_users.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('app_users')
            .select('id, name, email, subscription_status')
            .in('id', offer.target_users)
            .order('name');
          
          if (usersError) throw usersError;
          setTargetUsers(usersData || []);
        }
      } else if (offer.visibility === 'groups') {
        // Φόρτωση ομάδων
        if (offer.target_groups && offer.target_groups.length > 0) {
          const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('id, name, description')
            .in('id', offer.target_groups)
            .order('name');
          
          if (groupsError) throw groupsError;
          setTargetGroups(groupsData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching target data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const renderVisibilityInfo = () => {
    if (!offer) return null;
    
    switch (offer.visibility) {
      case 'all':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00ffba]" />
              <span className="font-medium">Εμφανής σε όλους τους χρήστες</span>
            </div>
            <p className="text-sm text-gray-600">
              Η προσφορά είναι ορατή σε όλους τους {allUsers.length} χρήστες του συστήματος.
            </p>
          </div>
        );
      
      case 'individual':
      case 'selected':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#00ffba]" />
              <span className="font-medium">Εμφανής σε επιλεγμένους χρήστες</span>
            </div>
            <p className="text-sm text-gray-600">
              Η προσφορά είναι ορατή σε {targetUsers.length} επιλεγμένους χρήστες.
            </p>
          </div>
        );
      
      case 'groups':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Group className="w-4 h-4 text-[#00ffba]" />
              <span className="font-medium">Εμφανής σε ομάδες</span>
            </div>
            <p className="text-sm text-gray-600">
              Η προσφορά είναι ορατή σε {targetGroups.length} επιλεγμένες ομάδες.
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle>Προπροβολή Προσφοράς</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φόρτωση...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Don't render if offer is null or undefined
  if (!offer) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Προπροβολή Προσφοράς: {offer?.name || 'Άγνωστη Προσφορά'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="rounded-none">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Πληροφορίες Προσφοράς</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Όνομα:</span> {offer?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Τιμή:</span> €{offer?.discounted_price || '0'}
                </div>
                <div>
                  <span className="font-medium">Περίοδος:</span> 
                  {offer?.start_date && offer?.end_date ? 
                    `${new Date(offer.start_date).toLocaleDateString('el-GR')} - ${new Date(offer.end_date).toLocaleDateString('el-GR')}` 
                    : 'N/A'
                  }
                </div>
                <div>
                  <span className="font-medium">Κατάσταση:</span> 
                  <Badge className={`ml-2 rounded-none ${offer?.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {offer?.is_active ? 'Ενεργή' : 'Ανενεργή'}
                  </Badge>
                </div>
              </div>
              {offer?.description && (
                <div className="mt-2">
                  <span className="font-medium">Περιγραφή:</span>
                  <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Ορατότητα Προσφοράς</h3>
              {renderVisibilityInfo()}
            </CardContent>
          </Card>

          {offer?.visibility === 'all' && allUsers.length > 0 && (
            <Card className="rounded-none">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Όλοι οι Χρήστες ({allUsers.length})</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded-none">
                      <div>
                        <span className="font-medium">{user?.name || 'N/A'}</span>
                        <span className="text-sm text-gray-600 ml-2">({user?.email || 'N/A'})</span>
                      </div>
                      <Badge variant="outline" className="rounded-none">
                        {user?.subscription_status || 'Χωρίς συνδρομή'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(offer?.visibility === 'individual' || offer?.visibility === 'selected') && targetUsers.length > 0 && (
            <Card className="rounded-none">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Στοχευμένοι Χρήστες ({targetUsers.length})</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {targetUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded-none">
                      <div>
                        <span className="font-medium">{user?.name || 'N/A'}</span>
                        <span className="text-sm text-gray-600 ml-2">({user?.email || 'N/A'})</span>
                      </div>
                      <Badge variant="outline" className="rounded-none">
                        {user?.subscription_status || 'Χωρίς συνδρομή'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {offer?.visibility === 'groups' && targetGroups.length > 0 && (
            <Card className="rounded-none">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Στοχευμένες Ομάδες ({targetGroups.length})</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {targetGroups.map((group) => (
                    <div key={group.id} className="p-2 border rounded-none">
                      <div className="font-medium">{group?.name || 'N/A'}</div>
                      {group?.description && (
                        <div className="text-sm text-gray-600 mt-1">{group.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};