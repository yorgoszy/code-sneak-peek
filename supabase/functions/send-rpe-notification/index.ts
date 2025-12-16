import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RpeNotificationRequest {
  userId: string;
  rpeScore: number;
  programName: string;
  dayName: string;
  scheduledDate: string;
}

const getRpeDescription = (rpe: number): string => {
  const descriptions: Record<number, string> = {
    5: "Εύκολο - Μπορούσα να κάνω πολλές επαναλήψεις ακόμα",
    6: "Σχετικά εύκολο - Είχα αρκετά αποθέματα",
    7: "Μέτριο - Είχα 3 επαναλήψεις ακόμα",
    8: "Δύσκολο - Είχα 2 επαναλήψεις ακόμα",
    9: "Πολύ δύσκολο - Είχα 1 επανάληψη ακόμα",
    10: "Μέγιστο - Δεν μπορούσα άλλη επανάληψη",
  };
  return descriptions[rpe] || "Άγνωστο";
};

const getRpeColor = (rpe: number): string => {
  if (rpe >= 9) return "#ef4444"; // red
  if (rpe >= 7) return "#eab308"; // yellow
  return "#22c55e"; // green
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, rpeScore, programName, dayName, scheduledDate }: RpeNotificationRequest = await req.json();

    console.log("📧 Sending RPE notification:", { userId, rpeScore, programName, dayName, scheduledDate });

    // Get user info from Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select("name, email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      throw new Error("User not found");
    }

    const rpeColor = getRpeColor(rpeScore);
    const rpeDescription = getRpeDescription(rpeScore);
    const formattedDate = new Date(scheduledDate).toLocaleDateString("el-GR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send email to admin
    const adminEmail = "yorgoszy@gmail.com";
    
    const emailResponse = await resend.emails.send({
      from: "RID Performance <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🏋️ RPE Score: ${user.name} - ${rpeScore}/10`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <h1 style="color: #00ffba; margin: 0; font-size: 24px;">RPE Score Report</h1>
            </div>
            
            <div style="padding: 24px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; border-radius: 50%; background-color: ${rpeColor}; line-height: 80px; text-align: center;">
                  <span style="color: white; font-size: 32px; font-weight: bold;">${rpeScore}</span>
                </div>
                <p style="color: #666; margin-top: 8px; font-size: 14px;">${rpeDescription}</p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #888; font-size: 14px;">Αθλητής</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${user.name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #888; font-size: 14px;">Πρόγραμμα</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${programName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #888; font-size: 14px;">Ημέρα</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${dayName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #888; font-size: 14px;">Ημερομηνία</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 600;">${formattedDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f8f8f8; padding: 16px; text-align: center;">
              <p style="color: #888; font-size: 12px; margin: 0;">RID Performance Training System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("✅ RPE notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error sending RPE notification:", error);
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
