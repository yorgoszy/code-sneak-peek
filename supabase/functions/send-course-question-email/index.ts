import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CourseQuestionRequest {
  courseId: string;
  courseTitle: string;
  coachId: string;
  question: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { courseId, courseTitle, coachId, question }: CourseQuestionRequest = await req.json();

    console.log("Received course question:", { courseId, courseTitle, coachId, question });

    // Get coach info
    const { data: coachData, error: coachError } = await supabase
      .from("app_users")
      .select("name, email")
      .eq("id", coachId)
      .single();

    if (coachError) {
      console.error("Error fetching coach:", coachError);
      throw coachError;
    }

    // Get admin emails (users with admin role)
    const { data: admins, error: adminError } = await supabase
      .from("app_users")
      .select("email, name")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      throw adminError;
    }

    if (!admins || admins.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // If no Resend API key, just log and return success
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - skipping email notification");
      console.log("Would have sent email to:", admins.map(a => a.email));
      console.log("Question from:", coachData?.name, coachData?.email);
      console.log("Course:", courseTitle);
      console.log("Question:", question);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email notification skipped - RESEND_API_KEY not configured" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email using Resend
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(resendApiKey);

    const adminEmails = admins.map(a => a.email);
    
    const emailResponse = await resend.emails.send({
      from: "HyperKids <onboarding@resend.dev>",
      to: adminEmails,
      subject: `Νέα ερώτηση για το μάθημα: ${courseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00ffba;">Νέα Ερώτηση στο Knowledge Base</h2>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Μάθημα:</strong> ${courseTitle}</p>
            <p><strong>Από:</strong> ${coachData?.name || "Unknown"} (${coachData?.email || "No email"})</p>
          </div>
          
          <div style="background: #fff; border-left: 4px solid #cb8954; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Ερώτηση:</strong></p>
            <p style="margin: 10px 0 0 0;">${question}</p>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            Απαντήστε απευθείας σε αυτό το email για να απαντήσετε στον coach.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-course-question-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
