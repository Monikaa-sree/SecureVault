import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { recipientEmail, fileId, fileName, mimeType, storagePath, appUrl } = await req.json();

    if (!recipientEmail || !fileId || !fileName || !storagePath || !appUrl) {
      throw new Error("Missing required fields");
    }

    // Create share record
    const { data: share, error: shareError } = await supabase
      .from("shared_files")
      .insert({
        file_id: fileId,
        recipient_email: recipientEmail,
        sender_user_id: user.id,
        file_name: fileName,
        mime_type: mimeType || null,
        storage_path: storagePath,
      })
      .select("share_token")
      .single();

    if (shareError) throw shareError;

    const decryptUrl = `${appUrl}/decrypt/${share.share_token}`;

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SecureVault <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `Encrypted file shared: ${fileName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1d4ed8;">🔒 Encrypted File Shared</h2>
            <p><strong>${user.email}</strong> has shared an encrypted file with you:</p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; font-weight: 600;">${fileName}</p>
            </div>
            <p>To view the decrypted file, you'll need the secret key from the sender.</p>
            <a href="${decryptUrl}" style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
              Open & Decrypt File
            </a>
            <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
              This link expires in 7 days. You'll need the secret key to decrypt the file.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      throw new Error(`Resend API error [${emailRes.status}]: ${errBody}`);
    }

    return new Response(JSON.stringify({ success: true, shareToken: share.share_token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-encrypted-email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
