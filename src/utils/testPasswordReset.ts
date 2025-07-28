// Temporary test file for password reset
import { supabase } from "@/integrations/supabase/client";

export const testPasswordReset = async (email: string) => {
  console.log('🧪 Testing password reset for:', email);
  
  try {
    const { data, error } = await supabase.functions.invoke('send-password-reset', {
      body: {
        email: email,
        redirectTo: `${window.location.origin}/auth/reset-password`
      }
    });

    console.log('📧 Password reset response:', { data, error });
    
    if (error) {
      console.error('❌ Password reset error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (err: any) {
    console.error('💥 Password reset exception:', err);
    return { success: false, error: err.message };
  }
};

// Test function to call from console
(window as any).testPasswordReset = testPasswordReset;