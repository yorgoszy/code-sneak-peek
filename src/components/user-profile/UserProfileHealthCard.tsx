import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHealthCard } from '@/hooks/useHealthCard';
import { useTranslation } from 'react-i18next';
import { format, addYears } from 'date-fns';
import { el, enUS } from 'date-fns/locale';
import { Upload, HeartPulse, Calendar, AlertTriangle, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import i18n from '@/i18n/config';

interface UserProfileHealthCardProps {
  userId: string;
}

export const UserProfileHealthCard = ({ userId }: UserProfileHealthCardProps) => {
  const { t } = useTranslation();
  const { healthCard, loading, uploadHealthCard, deleteHealthCard, getDaysUntilExpiry, isExpiringSoon, isExpired } = useHealthCard(userId);
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const locale = i18n.language === 'el' ? el : enUS;
  const daysLeft = getDaysUntilExpiry();
  const expiring = isExpiringSoon();
  const expired = isExpired();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    const success = await uploadHealthCard(selectedFile, new Date(startDate));
    if (success) {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    await deleteHealthCard();
    setDeleteDialogOpen(false);
  };

  const getStatusBadge = () => {
    if (!healthCard) return null;
    
    if (expired) {
      return (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-none">
          <XCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{t('healthCard.expired')}</span>
        </div>
      );
    }
    
    if (expiring) {
      return (
        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-none">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">{t('healthCard.expiringSoon', { days: daysLeft })}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-none">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{t('healthCard.valid', { days: daysLeft })}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Health Card */}
      {healthCard && (
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-[#00ffba]" />
              {t('healthCard.currentCard')}
            </CardTitle>
            {getStatusBadge()}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">{t('healthCard.startDate')}</Label>
                <p className="font-medium">
                  {format(new Date(healthCard.start_date), 'dd MMMM yyyy', { locale })}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">{t('healthCard.endDate')}</Label>
                <p className="font-medium">
                  {format(new Date(healthCard.end_date), 'dd MMMM yyyy', { locale })}
                </p>
              </div>
            </div>

            {healthCard.image_url && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">{t('healthCard.certificate')}</Label>
                <div className="flex items-center gap-4">
                  <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-none">
                        <Eye className="w-4 h-4 mr-2" />
                        {t('healthCard.view')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl rounded-none">
                      <DialogHeader>
                        <DialogTitle>{t('healthCard.certificate')}</DialogTitle>
                      </DialogHeader>
                      <img 
                        src={healthCard.image_url} 
                        alt="Health Card" 
                        className="w-full h-auto max-h-[70vh] object-contain"
                      />
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            )}

            {(expired || expiring) && (
              <div className={`p-4 rounded-none ${expired ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${expired ? 'text-red-600' : 'text-orange-600'}`} />
                  <div>
                    <p className={`font-medium ${expired ? 'text-red-700' : 'text-orange-700'}`}>
                      {expired ? t('healthCard.expiredWarning') : t('healthCard.expiringSoonWarning')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('healthCard.renewMessage')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload New/Update Health Card */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {healthCard ? t('healthCard.updateCard') : t('healthCard.uploadCard')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">{t('healthCard.issueDate')}</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-none"
            />
            <p className="text-sm text-gray-500">
              {t('healthCard.expiryCalculation')}: {format(addYears(new Date(startDate), 1), 'dd MMMM yyyy', { locale })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="healthCardImage">{t('healthCard.certificate')}</Label>
            <Input
              ref={fileInputRef}
              id="healthCardImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="rounded-none"
            />
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-500">{t('healthCard.preview')}</Label>
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-64 object-contain border rounded-none"
              />
            </div>
          )}

          <Button 
            onClick={handleSubmit}
            disabled={!selectedFile || loading}
            className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            {loading ? t('common.loading') : (healthCard ? t('healthCard.update') : t('healthCard.save'))}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('healthCard.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('healthCard.deleteConfirmMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
