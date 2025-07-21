
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  hasActiveSubscription: boolean;
  onSend: (files?: string[]) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isMobile?: boolean;
  userId?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  isLoading,
  hasActiveSubscription,
  onSend,
  onKeyPress,
  isMobile = false,
  userId
}) => {
  console.log('🔄 ChatInput: Props received:', { userId, hasActiveSubscription, isLoading });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{id: string, name: string, path: string}>>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !userId) return;

    setIsUploading(true);
    
    try {
      for (const file of files) {
        // Validate file type and size
        const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
        const isValidType = allowedTypes.some(type => file.type.startsWith(type));
        
        if (!isValidType) {
          toast.error(`Μη υποστηριζόμενος τύπος αρχείου: ${file.name}`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast.error(`Το αρχείο ${file.name} είναι πολύ μεγάλο (μέγιστο 10MB)`);
          continue;
        }

        // Upload to storage
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${userId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ai-chat-files')
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Σφάλμα κατά την αποστολή του ${file.name}`);
          continue;
        }

        // Save file metadata
        const { data: fileData, error: dbError } = await supabase
          .from('ai_chat_files')
          .insert({
            user_id: userId,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size
          })
          .select()
          .single();

        if (dbError) {
          toast.error(`Σφάλμα κατά την αποθήκευση του ${file.name}`);
          continue;
        }

        setUploadedFiles(prev => [...prev, {
          id: fileData.id,
          name: file.name,
          path: filePath
        }]);
      }
    } catch (error) {
      toast.error('Σφάλμα κατά την αποστολή αρχείων');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from('ai-chat-files').remove([filePath]);
      
      // Delete from database
      await supabase.from('ai_chat_files').delete().eq('id', fileId);
      
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      toast.error('Σφάλμα κατά τη διαγραφή αρχείου');
    }
  };

  const handleSend = () => {
    const filePaths = uploadedFiles.map(f => f.path);
    onSend(filePaths.length > 0 ? filePaths : undefined);
    setUploadedFiles([]); // Clear files after sending
  };

  const handleKeyPressWithFiles = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasActiveSubscription && (input.trim() || uploadedFiles.length > 0)) {
        handleSend();
      }
    }
  };

  return (
    <div className="border-t">
      {/* File upload area */}
      {uploadedFiles.length > 0 && (
        <div className="p-3 bg-gray-50 border-b">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-2 bg-white rounded px-3 py-1 text-sm border">
                <span className="truncate max-w-[200px]">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id, file.path)}
                  className="h-4 w-4 p-0 rounded-none"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 p-4">
        <div className="flex flex-col gap-2 flex-1">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPressWithFiles}
            placeholder={hasActiveSubscription ? "Πληκτρολογήστε το μήνυμά σας ή ανεβάστε αρχεία..." : "Απαιτείται συνδρομή..."}
            className="rounded-none min-h-[80px] max-h-[120px] resize-none"
            disabled={isLoading || !hasActiveSubscription}
            rows={3}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !hasActiveSubscription || isUploading}
            className="rounded-none"
            size="sm"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading || !hasActiveSubscription}
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};
