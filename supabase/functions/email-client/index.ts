// Edge Function: email-client
// Manages hyperkids.gr email via IMAP/SMTP for admin dashboard.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { ImapFlow } from "npm:imapflow@1.6.5";
import nodemailer from "npm:nodemailer@^9";
import { simpleParser } from "npm:mailparser@3.7.1";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NOTE: mail.hyperkids.gr has an EXPIRED TLS certificate and Deno ignores
// `rejectUnauthorized: false`, so we must connect via the hosting server's
// hostname, which serves a valid certificate for the same mailboxes.
const IMAP_HOST = Deno.env.get("EMAIL_IMAP_HOST") ?? "srv.redhost1.eu";
const IMAP_PORT = parseInt(Deno.env.get("EMAIL_IMAP_PORT") ?? "993", 10);
const SMTP_HOST = Deno.env.get("EMAIL_SMTP_HOST") ?? "srv.redhost1.eu";
const SMTP_PORT = parseInt(Deno.env.get("EMAIL_SMTP_PORT") ?? "465", 10);
const EMAIL_USER = Deno.env.get("EMAIL_USER") ?? "info@hyperkids.gr";
const EMAIL_PASS = Deno.env.get("EMAIL_PASSWORD") ?? "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "info@hyperkids.gr";

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function validateAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");

  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");

  const { data: appUser } = await supabase
    .from("app_users")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (appUser?.role !== "admin") throw new Error("Forbidden");
  return user;
}

function getImapClient() {
  return new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    // Use implicit TLS. STARTTLS on port 143 stalls in the Supabase Edge runtime.
    secure: IMAP_PORT === 993,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    tls: { rejectUnauthorized: false },
    logger: false,
    disableAutoIdle: true,
    connectionTimeout: 30000,
    greetingTimeout: 20000,
    socketTimeout: 45000,
  });
}

// Never let logout() mask the real error (it throws "Connection not available"
// when connect() itself failed).
async function safeLogout(client: any) {
  // ImapFlow throws "Connection not available" if logout is attempted after
  // connect() failed. Closing the socket is sufficient in that state.
  if (!client.usable) {
    try { client.close(); } catch (_e) { /* ignore */ }
    return;
  }
  try {
    await client.logout();
  } catch (_e) {
    try { client.close(); } catch (_e2) { /* ignore */ }
  }
}

function serializeFlags(flags: unknown): string[] {
  if (Array.isArray(flags)) return flags.map(String);
  if (flags instanceof Set) return Array.from(flags, String);
  if (flags && typeof (flags as { values?: unknown }).values === "function") {
    return Array.from((flags as { values: () => Iterable<unknown> }).values(), String);
  }
  return [];
}


async function listFolders() {
  const client = getImapClient();
  try {
    await client.connect();
    const tree = await client.listTree({ statusQuery: { messages: true, unseen: true } });
    return { folders: tree };
  } finally {
    await safeLogout(client);
  }
}

async function listEmails(folder: string, limit = 50) {
  const client = getImapClient();
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      const total = client.mailbox?.exists ?? 0;
      const unseen = client.mailbox?.unseen ?? 0;
      const seqEnd = Math.max(1, total);
      const seqStart = Math.max(1, total - limit + 1);
      const messages: any[] = [];

      if (total > 0) {
        for await (const msg of client.fetch(`${seqStart}:${seqEnd}`, {
          envelope: true,
          flags: true,
          internalDate: true,
          size: true,
          uid: true,
        })) {
          messages.push({
            uid: msg.uid,
            seq: msg.seq,
            subject: msg.envelope?.subject ?? "",
            from: msg.envelope?.from ?? [],
            to: msg.envelope?.to ?? [],
            date: msg.envelope?.date ?? null,
            internalDate: msg.internalDate ? msg.internalDate.toISOString() : null,
            flags: serializeFlags(msg.flags),
            size: msg.size ?? 0,
          });
        }
      }

      return { folder, total, unseen, messages: messages.reverse() };
    } finally {
      lock.release();
    }
  } finally {
    await safeLogout(client);
  }
}

async function getEmail(folder: string, uid: number) {
  const client = getImapClient();
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      const msg = await client.fetchOne(`${uid}`, { source: true, envelope: true, flags: true, uid: true }, { uid: true });
      if (!msg || typeof msg === "boolean") return null;

      const parsed = await simpleParser(msg.source);
      const html = typeof parsed.html === "string" ? parsed.html : "";
      const text = parsed.text ?? "";

      return {
        uid: msg.uid,
        seq: msg.seq,
        subject: parsed.subject ?? msg.envelope?.subject ?? "",
        from: msg.envelope?.from ?? [],
        to: msg.envelope?.to ?? [],
        date: msg.envelope?.date ?? null,
        flags: serializeFlags(msg.flags),
        size: msg.size ?? 0,
        isHtml: Boolean(html),
        body: html || text,
        attachments: (parsed.attachments ?? []).map((a: any, i: number) => ({
          index: i,
          filename: a.filename ?? `attachment-${i + 1}`,
          contentType: a.contentType ?? "application/octet-stream",
          size: a.size ?? 0,
        })),
      };
    } finally {
      lock.release();
    }
  } finally {
    await safeLogout(client);
  }
}


function toBase64(data: any): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function getAttachment(folder: string, uid: number, index: number) {
  const client = getImapClient();
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      const msg = await client.fetchOne(`${uid}`, { source: true, uid: true }, { uid: true });
      if (!msg || typeof msg === "boolean") throw new Error("Το email δεν βρέθηκε");
      const parsed = await simpleParser(msg.source);
      const att = (parsed.attachments ?? [])[index];
      if (!att) throw new Error("Το συνημμένο δεν βρέθηκε");
      return {
        filename: att.filename ?? `attachment-${index + 1}`,
        contentType: att.contentType ?? "application/octet-stream",
        size: att.size ?? 0,
        base64: toBase64(att.content),
      };
    } finally {
      lock.release();
    }
  } finally {
    await safeLogout(client);
  }
}

async function setSeen(folder: string, uid: number, seen: boolean) {
  const client = getImapClient();
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      if (seen) {
        await client.messageFlagsAdd({ uid: String(uid) }, ["\\Seen"], { uid: true });
      } else {
        await client.messageFlagsRemove({ uid: String(uid) }, ["\\Seen"], { uid: true });
      }
      return { ok: true, uid, seen };
    } finally {
      lock.release();
    }
  } finally {
    await safeLogout(client);
  }
}

async function findTrashFolder(client: any): Promise<string | null> {
  try {
    const list = await client.list();
    const trash = list.find((m: any) =>
      m.specialUse === "\\Trash" || /^(trash|deleted|deleted items|junk)$/i.test(m.name ?? "")
    );
    return trash?.path ?? null;
  } catch (_e) {
    return null;
  }
}

async function deleteEmail(folder: string, uid: number) {
  const client = getImapClient();
  try {
    await client.connect();
    const trash = await findTrashFolder(client);
    const lock = await client.getMailboxLock(folder);
    try {
      if (trash && trash !== folder) {
        await client.messageMove({ uid: String(uid) }, trash, { uid: true });
        return { ok: true, uid, movedTo: trash };
      }
      await client.messageDelete({ uid: String(uid) }, { uid: true });
      return { ok: true, uid, deleted: true };
    } finally {
      lock.release();
    }
  } finally {
    await safeLogout(client);
  }
}

interface OutgoingAttachment {
  filename?: string;
  contentType?: string;
  base64?: string;
}

async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: OutgoingAttachment[]
) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    tls: { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
    attachments: (attachments ?? [])
      .filter((a) => a?.base64)
      .map((a, i) => ({
        filename: a.filename ?? `attachment-${i + 1}`,
        content: a.base64!,
        encoding: "base64",
        contentType: a.contentType ?? "application/octet-stream",
      })),
  });

  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    await validateAdmin(req);
    const body = await req.json().catch(() => ({}));
    const { action, folder, uid, to, subject, text, html, limit, attachments, attachmentIndex } = body;

    let result: any;
    if (action === "list-folders") {
      result = await listFolders();
    } else if (action === "list-emails") {
      result = await listEmails(folder ?? "INBOX", limit ?? 50);
    } else if (action === "get-email") {
      result = await getEmail(folder ?? "INBOX", uid ?? 0);
    } else if (action === "send-email") {
      result = await sendEmail(to ?? "", subject ?? "", text ?? "", html, attachments);
    } else if (action === "get-attachment") {
      result = await getAttachment(folder ?? "INBOX", uid ?? 0, attachmentIndex ?? 0);
    } else if (action === "mark-read") {
      result = await setSeen(folder ?? "INBOX", uid ?? 0, true);
    } else if (action === "mark-unread") {
      result = await setSeen(folder ?? "INBOX", uid ?? 0, false);
    } else if (action === "delete-email") {
      result = await deleteEmail(folder ?? "INBOX", uid ?? 0);
    } else {
      throw new Error("Unknown action");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("email-client error:", err);
    const status = err.message === "Unauthorized" ? 401 : err.message === "Forbidden" ? 403 : 500;
    const connectionError = ["ETIMEDOUT", "CONNECT_TIMEOUT", "UPGRADE_TIMEOUT", "ECONNREFUSED"].includes(err.code);
    const certError = String(err.message ?? "").includes("certificate");
    const message = certError
      ? "Το SSL certificate του mail server έχει λήξει. Ανανεώστε το (Let's Encrypt στο Plesk) ή ορίστε EMAIL_IMAP_HOST/EMAIL_SMTP_HOST σε hostname με έγκυρο certificate."
      : connectionError
      ? "Ο mail server δεν δέχτηκε έγκαιρα την ασφαλή σύνδεση. Ελέγξτε το SSL του mail.hyperkids.gr."
      : err.message;
    return new Response(JSON.stringify({ error: message, code: err.code ?? "EMAIL_ERROR" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
