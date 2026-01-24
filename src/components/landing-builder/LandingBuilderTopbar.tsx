import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Eye, 
  EyeOff, 
  Undo2, 
  Redo2,
  FileDown,
  FileUp,
  Plus,
  Check,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Layout {
  id: string;
  name: string;
  is_published: boolean;
  is_active: boolean;
}

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface LandingBuilderTopbarProps {
  previewMode: boolean;
  setPreviewMode: (preview: boolean) => void;
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  onSave: (name: string, layoutData: string) => Promise<void>;
  onLoad: (layoutId: string) => Promise<string | null>;
  layouts: Layout[];
  currentLayoutId: string | null;
  setCurrentLayoutId: (id: string | null) => void;
}

export const LandingBuilderTopbar: React.FC<LandingBuilderTopbarProps> = ({
  previewMode,
  setPreviewMode,
  deviceMode,
  setDeviceMode,
  onSave,
  onLoad,
  layouts,
  currentLayoutId,
  setCurrentLayoutId
}) => {
  const { actions, query, canUndo, canRedo } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const [newLayoutName, setNewLayoutName] = useState('');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const json = query.serialize();
      const name = currentLayoutId 
        ? layouts.find(l => l.id === currentLayoutId)?.name || 'Untitled'
        : 'Untitled';
      await onSave(name, json);
      toast.success('Layout saved!');
    } catch (error) {
      toast.error('Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newLayoutName.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    try {
      setIsSaving(true);
      const json = query.serialize();
      await onSave(newLayoutName, json);
      setNewLayoutName('');
      setIsNewDialogOpen(false);
      toast.success('New layout created!');
    } catch (error) {
      toast.error('Failed to create layout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadLayout = async (layoutId: string) => {
    try {
      const layoutData = await onLoad(layoutId);
      if (layoutData) {
        actions.deserialize(layoutData);
        setCurrentLayoutId(layoutId);
        toast.success('Layout loaded!');
      }
    } catch (error) {
      toast.error('Failed to load layout');
    }
  };

  return (
    <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="font-semibold text-lg text-foreground">Landing Page Builder</h1>
        
        <div className="ml-4 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => actions.history.undo()}
            disabled={!canUndo}
            className="rounded-none"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => actions.history.redo()}
            disabled={!canRedo}
            className="rounded-none"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Device Mode Selector */}
        <div className="ml-4 flex items-center gap-1 border border-border rounded-none p-1">
          <Button
            variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setDeviceMode('desktop')}
            className={`rounded-none h-7 w-7 ${deviceMode === 'desktop' ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black' : ''}`}
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant={deviceMode === 'tablet' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setDeviceMode('tablet')}
            className={`rounded-none h-7 w-7 ${deviceMode === 'tablet' ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black' : ''}`}
            title="Tablet"
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setDeviceMode('mobile')}
            className={`rounded-none h-7 w-7 ${deviceMode === 'mobile' ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black' : ''}`}
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {layouts.length > 0 && (
          <Select value={currentLayoutId || ''} onValueChange={handleLoadLayout}>
            <SelectTrigger className="w-48 rounded-none">
              <SelectValue placeholder="Επιλογή layout..." />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {layouts.map((layout) => (
                <SelectItem key={layout.id} value={layout.id} className="rounded-none">
                  {layout.name} {layout.is_active && <Check className="inline w-3 h-3 ml-1" />}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-none">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle>New Layout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  placeholder="Enter layout name..."
                  className="rounded-none mt-1"
                />
              </div>
              <Button 
                onClick={handleCreateNew} 
                disabled={isSaving}
                className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewMode(!previewMode)}
          className="rounded-none"
        >
          {previewMode ? (
            <>
              <EyeOff className="w-4 h-4 mr-1" />
              Edit
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </>
          )}
        </Button>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};
