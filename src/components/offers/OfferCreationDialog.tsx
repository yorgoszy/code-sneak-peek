import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn, matchesSearchTerm } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  subscription_mode: string;
  duration_months: number;
  visit_count?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
}

interface OfferCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OfferCreationDialog: React.FC<OfferCreationDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const isMobile = useIsMobile();
  const [saving, setSaving] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subscriptionTypeId, setSubscriptionTypeId] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [visibility, setVisibility] = useState<'all' | 'individual' | 'selected' | 'groups' | 'magic_box_losers'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isFree, setIsFree] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      // Φόρτωση subscription types
      const { data: types } = await supabase
        .from('subscription_types')
        .select('id, name, description, price, subscription_mode, duration_months, visit_count')
        .eq('is_active', true);
      
      setSubscriptionTypes(types || []);

      // Φόρτωση users
      const { data: usersData } = await supabase
        .from('app_users')
        .select('id, name, email')
        .order('name');
      
      setUsers(usersData || []);

      // Φόρτωση groups
      const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name, description')
        .order('name');
      
      setGroups(groupsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSubscriptionTypeId('');
    setDiscountedPrice('');
    setStartDate(new Date());
    setEndDate(undefined);
    setVisibility('all');
    setSelectedUsers([]);
    setSelectedGroups([]);
    setIsFree(false);
    setUserSearchTerm('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim() || !subscriptionTypeId || (!isFree && !discountedPrice) || !startDate || !endDate) {
      toast.error('Συμπληρώστε όλα τα απαιτούμενα πεδία');
      return;
    }

    const price = isFree ? 0 : parseFloat(discountedPrice);
    if (!isFree && (isNaN(price) || price <= 0)) {
      toast.error('Η τιμή πρέπει να είναι θετικός αριθμός');
      return;
    }

    if (endDate <= startDate) {
      toast.error('Η ημερομηνία λήξης πρέπει να είναι μετά την ημερομηνία έναρξης');
      return;
    }

    setSaving(true);
    try {
      // Πάρε το current user id
      const { data: { user } } = await supabase.auth.getUser();
      const { data: currentUserData } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      const offerData = {
        name: name.trim(),
        description: description.trim() || null,
        subscription_type_id: subscriptionTypeId,
        discounted_price: price,
        is_free: isFree,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        visibility,
        target_users: visibility === 'individual' || visibility === 'selected' ? selectedUsers : [],
        target_groups: visibility === 'groups' ? selectedGroups : [],
        is_active: true,
        created_by: currentUserData?.id
      };

      console.log('Creating offer with data:', offerData);

      const { data, error } = await supabase
        .from('offers')
        .insert(offerData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Offer created successfully:', data);

      // Αποστολή email notifications
      try {
        const notificationResponse = await supabase.functions.invoke('send-offer-notifications', {
          body: {
            offerId: data[0].id,
            offerName: name.trim(),
            visibility,
            targetUsers: visibility === 'individual' || visibility === 'selected' ? selectedUsers : [],
            targetGroups: visibility === 'groups' ? selectedGroups : []
          }
        });

        if (notificationResponse.error) {
          console.error('Notification error:', notificationResponse.error);
          toast.error('Η προσφορά δημιουργήθηκε αλλά υπήρξε πρόβλημα με τα emails');
        } else {
          console.log('Notifications sent:', notificationResponse.data);
          toast.success('Η προσφορά δημιουργήθηκε και στάλθηκαν τα emails!');
        }
      } catch (notificationError) {
        console.error('Notification sending failed:', notificationError);
        toast.success('Η προσφορά δημιουργήθηκε επιτυχώς!');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error('Σφάλμα κατά τη δημιουργία της προσφοράς');
    } finally {
      setSaving(false);
    }
  };

  const selectedSubscriptionType = subscriptionTypes.find(type => type.id === subscriptionTypeId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-2xl max-h-[80vh]'} overflow-y-auto rounded-none`}>
        <DialogHeader>
          <DialogTitle className={isMobile ? 'text-lg' : 'text-xl'}>
            {isMobile ? 'Νέα Προσφορά' : 'Δημιουργία Νέας Προσφοράς'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <div>
              <Label htmlFor="name">Όνομα Προσφοράς *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Χριστουγεννιάτικη Προσφορά"
                className="rounded-none"
              />
            </div>
            <div>
              <Label htmlFor="discountedPrice">Τιμή Προσφοράς (€) *</Label>
              <Input
                id="discountedPrice"
                type="number"
                step="0.01"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                placeholder="0.00"
                className="rounded-none"
                disabled={isFree}
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="isFree"
                  checked={isFree}
                  onCheckedChange={(checked) => {
                    setIsFree(!!checked);
                    if (checked) {
                      setDiscountedPrice('0');
                    } else {
                      setDiscountedPrice('');
                    }
                  }}
                />
                <Label htmlFor="isFree" className="text-sm cursor-pointer">
                  Δωρεάν προσφορά
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Περιγραφή</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Περιγραφή της προσφοράς..."
              className="rounded-none"
              rows={3}
            />
          </div>

          <div>
            <Label>Τύπος Συνδρομής *</Label>
            <Select value={subscriptionTypeId} onValueChange={setSubscriptionTypeId}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε τύπο συνδρομής" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white">
                {subscriptionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{type.name}</span>
                      <Badge variant="outline" className="ml-2">
                        €{type.price}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSubscriptionType && (
              <Card className="mt-2 rounded-none">
                <CardContent className="p-3">
                  <div className="text-sm">
                    <div className="font-medium">{selectedSubscriptionType.name}</div>
                    <div className="text-gray-600">Κανονική Τιμή: €{selectedSubscriptionType.price}</div>
                    {selectedSubscriptionType.description && (
                      <div className="text-gray-500 mt-1">{selectedSubscriptionType.description}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <div>
              <Label>Ημερομηνία Έναρξης *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-none",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Επιλέξτε ημερομηνία"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Ημερομηνία Λήξης *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-none",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Επιλέξτε ημερομηνία"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Ορατότητα Προσφοράς</Label>
            <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white">
                <SelectItem value="all">Εμφανής σε όλους</SelectItem>
                <SelectItem value="individual">Μεμονωμένους χρήστες</SelectItem>
                <SelectItem value="selected">Επιλεγμένους χρήστες</SelectItem>
                <SelectItem value="groups">Ομάδες</SelectItem>
                <SelectItem value="magic_box_losers">Σε όσους δεν κέρδισαν στο magic box</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(visibility === 'individual' || visibility === 'selected') && (
            <div>
              <Label>Επιλογή Χρηστών</Label>
              <Input
                type="text"
                placeholder="Αναζήτηση χρηστών..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="rounded-none mb-2"
              />
              <div className={`border border-gray-200 rounded-none p-2 ${isMobile ? 'max-h-40' : 'max-h-32'} overflow-y-auto`}>
                {users
                  .filter(user => 
                    !userSearchTerm || 
                    matchesSearchTerm(user.name, userSearchTerm) || 
                    matchesSearchTerm(user.email, userSearchTerm)
                  )
                  .map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                      <label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer w-full">
                        {user.name} ({user.email})
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {visibility === 'groups' && (
            <div>
              <Label>Επιλογή Ομάδων</Label>
              <div className={`border border-gray-200 rounded-none p-2 ${isMobile ? 'max-h-40' : 'max-h-32'} overflow-y-auto`}>
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`group-${group.id}`}
                      checked={selectedGroups.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroups([...selectedGroups, group.id]);
                        } else {
                          setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                        }
                      }}
                    />
                    <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer">
                      {group.name}
                      {group.description && (
                        <span className="text-gray-500 ml-1">({group.description})</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-end space-x-2'} pt-4`}>
          <Button 
            onClick={handleClose} 
            variant="outline" 
            className={`rounded-none ${isMobile ? 'order-2' : ''}`}
          >
            Ακύρωση
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className={`bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none ${isMobile ? 'order-1' : ''}`}
          >
            {saving ? 'Δημιουργία...' : 'Δημιουργία Προσφοράς'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};