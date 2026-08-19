import React, { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Loader2,
  Mail,
  Send,
  RefreshCw,
  ChevronLeft,
  X,
  ArrowLeft,
  Menu,
  Trash2,
  MailOpen,
  Circle,
  Paperclip,
  Download,
} from "lucide-react";

interface EmailFolder {
  path: string;
  name: string;
  specialUse?: string;
  status?: { messages?: number; unseen?: number };
  folders?: EmailFolder[];
}

interface EmailMessage {
  uid: number;
  seq: number;
  subject: string;
  from: { name?: string; address?: string }[];
  to: { name?: string; address?: string }[];
  date: string | null;
  internalDate: string | null;
  flags: unknown;
  size: number;
  hasAttachments?: boolean;
}

interface EmailDetail extends EmailMessage {
  body: string;
  isHtml: boolean;
  attachments?: { index?: number; filename: string; contentType: string; size: number }[];
}


const FUNCTION_NAME = "email-client";

async function invokeEmail(action: string, payload: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action, ...payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

function flattenFolders(tree: EmailFolder): EmailFolder[] {
  const result: EmailFolder[] = [];
  function walk(node: EmailFolder, prefix = "") {
    const displayName = node.name || node.path;
    result.push({ ...node, name: prefix ? `${prefix} / ${displayName}` : displayName });
    if (node.folders) {
      for (const child of node.folders) walk(child, displayName);
    }
  }
  walk(tree);
  // Deduplicate by path (root node can repeat) and drop empty paths
  const seen = new Set<string>();
  return result.filter((f) => {
    if (!f.path || seen.has(f.path)) return false;
    seen.add(f.path);
    return true;
  });
}

function formatAddress(addr?: { name?: string; address?: string }) {
  if (!addr) return "";
  return addr.name ? `${addr.name} <${addr.address}>` : addr.address || "";
}

function formatSize(bytes?: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function senderLabel(msg: EmailMessage) {
  const first = msg.from?.[0];
  return first?.name || first?.address || "(κενός αποστολέας)";
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return sameDay
      ? d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

function formatFullDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function normalizeFlags(flags: unknown): string[] {
  if (Array.isArray(flags)) return flags.filter((flag): flag is string => typeof flag === "string");
  if (flags instanceof Set) return Array.from(flags).filter((flag): flag is string => typeof flag === "string");
  if (typeof flags === "string") return [flags];
  if (flags && typeof flags === "object") {
    return Object.values(flags).filter((flag): flag is string => typeof flag === "string");
  }
  return [];
}

export const EmailClient: React.FC<{ onOpenAppMenu?: () => void }> = ({ onOpenAppMenu }) => {
  const { session } = useAuthContext();
  const { toast } = useToast();
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("INBOX");
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"folders" | "list" | "detail">("list");
  const [composeForm, setComposeForm] = useState({ to: "", subject: "", body: "" });
  const [composeFiles, setComposeFiles] = useState<File[]>([]);
  const composeFileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingAtt, setDownloadingAtt] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [busyUid, setBusyUid] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailMessage | null>(null);
  const [swipe, setSwipe] = useState<{ uid: number; dx: number } | null>(null);
  const swipeStart = useRef<{ x: number; y: number; uid: number; active: boolean } | null>(null);

  const SWIPE_THRESHOLD = 90;

  const handleTouchStart = (uid: number) => (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY, uid, active: false };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const start = swipeStart.current;
    if (!start) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (!start.active) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      start.active = true;
    }
    setSwipe({ uid: start.uid, dx: Math.max(0, dx) });
  };

  const handleTouchEnd = (email: EmailMessage) => () => {
    const start = swipeStart.current;
    const dx = swipe?.uid === email.uid ? swipe.dx : 0;
    swipeStart.current = null;
    setSwipe(null);
    if (start?.active && dx >= SWIPE_THRESHOLD) {
      setDeleteTarget(email);
    }
  };


  const loadFolders = async () => {
    setLoadingFolders(true);
    try {
      const data = await invokeEmail("list-folders");
      const flat = data?.folders ? flattenFolders(data.folders) : [];
      setFolders(flat);
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err.message || "Δεν ήταν δυνατή η φόρτωση φακέλων", variant: "destructive" });
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadEmails = async (folder: string) => {
    setLoadingEmails(true);
    try {
      const data = await invokeEmail("list-emails", { folder, limit: 50 });
      setEmails(data?.messages ?? []);
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err.message || "Δεν ήταν δυνατή η φόρτωση emails", variant: "destructive" });
    } finally {
      setLoadingEmails(false);
    }
  };

  const setLocalSeen = (uid: number, seen: boolean) => {
    setEmails((prev) =>
      prev.map((m) => {
        if (m.uid !== uid) return m;
        const flags = normalizeFlags(m.flags).filter((f) => f !== "\\Seen");
        return { ...m, flags: seen ? [...flags, "\\Seen"] : flags };
      })
    );
  };

  const markRead = async (uid: number, seen: boolean, silent = false) => {
    setLocalSeen(uid, seen);
    try {
      await invokeEmail(seen ? "mark-read" : "mark-unread", { folder: selectedFolder, uid });
      if (!silent) {
        toast({ title: seen ? "Αναγνωσμένο" : "Μη αναγνωσμένο" });
      }
      loadFolders();
    } catch (err: any) {
      setLocalSeen(uid, !seen);
      toast({ title: "Σφάλμα", description: err.message || "Αποτυχία ενημέρωσης", variant: "destructive" });
    }
  };

  const loadEmail = async (folder: string, uid: number) => {
    setLoadingEmail(true);
    setMobileView("detail");
    try {
      const data = await invokeEmail("get-email", { folder, uid });
      setSelectedEmail(data);
      setEmails((prev) =>
        prev.map((message) =>
          message.uid === uid
            ? { ...message, hasAttachments: Boolean(data?.attachments?.length) }
            : message
        )
      );
      const wasUnread = !normalizeFlags(data?.flags).includes("\\Seen");
      if (wasUnread) markRead(uid, true, true);
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err.message || "Δεν ήταν δυνατή η φόρτωση του email", variant: "destructive" });
    } finally {
      setLoadingEmail(false);
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    setBusyUid(target.uid);
    try {
      await invokeEmail("delete-email", { folder: selectedFolder, uid: target.uid });
      setEmails((prev) => prev.filter((m) => m.uid !== target.uid));
      if (selectedEmail?.uid === target.uid) {
        setSelectedEmail(null);
        setMobileView("list");
      }
      toast({ title: "Διαγράφηκε", description: "Το email μεταφέρθηκε στα διαγραμμένα" });
      loadFolders();
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err.message || "Αποτυχία διαγραφής", variant: "destructive" });
    } finally {
      setBusyUid(null);
    }
  };

  const sendEmail = async () => {
    if (!composeForm.to || !composeForm.subject) {
      toast({ title: "Συμπληρώστε τα πεδία", description: "Απαιτούνται παραλήπτης και θέμα", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const attachments = await Promise.all(
        composeFiles.map(
          (file) =>
            new Promise<{ filename: string; contentType: string; base64: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  filename: file.name,
                  contentType: file.type || "application/octet-stream",
                  base64: String(reader.result).split(",")[1] ?? "",
                });
              reader.onerror = () => reject(new Error(`Αποτυχία ανάγνωσης: ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      );
      await invokeEmail("send-email", {
        to: composeForm.to,
        subject: composeForm.subject,
        text: composeForm.body,
        attachments,
      });
      toast({ title: "Αποστολή", description: "Το email στάλθηκε επιτυχώς" });
      setComposeOpen(false);
      setComposeForm({ to: "", subject: "", body: "" });
      setComposeFiles([]);
      if (selectedFolder.toLowerCase().includes("sent")) {
        loadEmails(selectedFolder);
      }
    } catch (err: any) {
      toast({ title: "Σφάλμα αποστολής", description: err.message || "Αποτυχία αποστολής", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const downloadAttachment = async (index: number, filename: string) => {
    if (!selectedEmail) return;
    setDownloadingAtt(index);
    try {
      const data = await invokeEmail("get-attachment", {
        folder: selectedFolder,
        uid: selectedEmail.uid,
        attachmentIndex: index,
      });
      const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: data.contentType }));
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename || filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err.message || "Αποτυχία λήψης συνημμένου", variant: "destructive" });
    } finally {
      setDownloadingAtt(null);
    }
  };

  useEffect(() => {
    if (session) loadFolders();
  }, [session]);

  useEffect(() => {
    if (session) {
      loadEmails(selectedFolder);
      setSelectedEmail(null);
    }
  }, [session, selectedFolder]);

  const selectedFolderData = useMemo(() => folders.find((f) => f.path === selectedFolder), [folders, selectedFolder]);
  const isUnread = (msg: EmailMessage) => !normalizeFlags(msg.flags).includes("\\Seen");
  const unreadCount = emails.filter(isUnread).length;

  const foldersPanel = (
    <div className="h-full min-h-0 flex flex-col border-r border-border bg-background">
      <div className="h-14 shrink-0 px-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </h2>
        <Button variant="ghost" size="icon" onClick={loadFolders} disabled={loadingFolders} className="rounded-none h-8 w-8">
          <RefreshCw className={`h-4 w-4 ${loadingFolders ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-2 space-y-0.5">
          {folders.map((folder) => {
            const active = selectedFolder === folder.path;
            return (
              <button
                key={folder.path}
                onClick={() => {
                  setSelectedFolder(folder.path);
                  setMobileView("list");
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between rounded-none border-l-2 transition-colors ${
                  active
                    ? "border-[#00ffba] bg-accent font-medium"
                    : "border-transparent hover:bg-accent/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="truncate">{folder.name}</span>
                {(folder.status?.unseen ?? 0) > 0 && (
                  <Badge variant="secondary" className="rounded-none ml-2 text-[10px] px-1.5">
                    {folder.status?.unseen}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-3 border-t border-border shrink-0">
        <Button
          onClick={() => setComposeOpen(true)}
          className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Send className="h-4 w-4 mr-2" />
          Νέο Email
        </Button>
      </div>
    </div>
  );

  const emailListPanel = (
    <div className="h-full min-h-0 flex flex-col border-r border-border bg-background">
      <div className="h-14 shrink-0 px-3 border-b border-border flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setMobileView("folders")} className="lg:hidden rounded-none">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{selectedFolderData?.name || selectedFolder}</h3>
          <p className="text-[11px] text-muted-foreground">
            {emails.length} μηνύματα{unreadCount > 0 ? ` · ${unreadCount} νέα` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => loadEmails(selectedFolder)}
          disabled={loadingEmails}
          className="rounded-none h-8 w-8 ml-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loadingEmails ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="divide-y divide-border">
          {loadingEmails && emails.length === 0 && (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {!loadingEmails && emails.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Δεν βρέθηκαν emails</div>
          )}
          {emails.map((email) => {
            const unread = isUnread(email);
            const active = selectedEmail?.uid === email.uid;
            const dx = swipe?.uid === email.uid ? swipe.dx : 0;
            return (
              <div key={email.uid} className="relative overflow-hidden">
                {dx > 0 && (
                  <div className="absolute inset-0 flex items-center gap-2 px-3 bg-destructive text-destructive-foreground">
                    <Trash2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Διαγραφή</span>
                  </div>
                )}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (dx > 0) return;
                  loadEmail(selectedFolder, email.uid);
                }}
                onKeyDown={(e) => e.key === "Enter" && loadEmail(selectedFolder, email.uid)}
                onTouchStart={handleTouchStart(email.uid)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd(email)}
                onTouchCancel={handleTouchEnd(email)}
                style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
                className={`group relative w-full text-left px-3 py-2.5 cursor-pointer transition-colors border-l-2 bg-background ${
                  active ? "border-[#00ffba] bg-accent" : "border-transparent hover:bg-accent/50"
                }`}
              >

                <div className="flex items-center gap-2">
                  {unread ? (
                    <Circle className="h-2 w-2 shrink-0 fill-[#00ffba] text-[#00ffba]" />
                  ) : (
                    <span className="h-2 w-2 shrink-0" />
                  )}
                  <p className={`text-sm truncate flex-1 ${unread ? "font-semibold" : "text-muted-foreground"}`}>
                    {senderLabel(email)}
                  </p>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDate(email.internalDate || email.date)}
                  </span>
                </div>
                <p className={`text-sm truncate pl-4 ${unread ? "font-medium" : ""}`}>
                  {email.subject || "(χωρίς θέμα)"}
                </p>
                {email.hasAttachments && (
                  <Paperclip
                    className="absolute right-3 top-8 h-3.5 w-3.5 text-muted-foreground group-hover:hidden"
                    aria-label="Έχει συνημμένα"
                  />
                )}
                <div className="absolute right-2 bottom-1.5 hidden group-hover:flex items-center gap-1 bg-background/95 border border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-none"
                    title={unread ? "Σήμανση ως αναγνωσμένο" : "Σήμανση ως μη αναγνωσμένο"}
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(email.uid, unread);
                    }}
                  >
                    <MailOpen className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-none text-destructive"
                    title="Διαγραφή"
                    disabled={busyUid === email.uid}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(email);
                    }}
                  >
                    {busyUid === email.uid ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              </div>

            );
          })}
        </div>
      </div>
    </div>
  );

  const detailPanel = (
    <div className="h-full min-h-0 flex flex-col bg-background">
      <div className="h-14 shrink-0 px-3 border-b border-border flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedEmail(null);
            setMobileView("list");
          }}
          className="lg:hidden rounded-none"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold text-sm truncate flex-1">{selectedEmail?.subject || "Λεπτομέρειες"}</h3>
        {selectedEmail && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-none"
              title="Σήμανση ως μη αναγνωσμένο"
              onClick={() => markRead(selectedEmail.uid, false)}
            >
              <MailOpen className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-none text-destructive"
              title="Διαγραφή"
              onClick={() => setDeleteTarget(selectedEmail)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {loadingEmail && !selectedEmail && (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        {!loadingEmail && !selectedEmail && (
          <div className="text-center text-sm text-muted-foreground p-8">Επιλέξτε ένα email για προβολή</div>
        )}
        {selectedEmail && (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Από:</span>{" "}
                {selectedEmail.from.map(formatAddress).join(", ")}
              </p>
              <p>
                <span className="text-muted-foreground">Προς:</span>{" "}
                {selectedEmail.to.map(formatAddress).join(", ")}
              </p>
              <p>
                <span className="text-muted-foreground">Ημερομηνία:</span> {formatFullDate(selectedEmail.date)}
              </p>
            </div>
            {!!selectedEmail.attachments?.length && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    Συνημμένα ({selectedEmail.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, i) => {
                      const idx = att.index ?? i;
                      return (
                        <Button
                          key={`${att.filename}-${idx}`}
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAttachment(idx, att.filename)}
                          disabled={downloadingAtt === idx}
                          className="rounded-none text-xs max-w-full"
                        >
                          {downloadingAtt === idx ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5 mr-1" />
                          )}
                          <span className="truncate">{att.filename}</span>
                          <span className="ml-1 text-muted-foreground">({formatSize(att.size)})</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            <Separator />
            {selectedEmail.isHtml ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert break-words"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body) }}
              />
            ) : (
              <pre className="whitespace-pre-wrap break-words font-sans text-sm">{selectedEmail.body}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] lg:h-screen flex flex-col overflow-hidden">
      {/* Mobile header */}
      <div className="lg:hidden shrink-0 bg-background border-b border-border p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onOpenAppMenu && (
            <Button variant="outline" size="sm" onClick={onOpenAppMenu} className="rounded-none">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setMobileView("folders")} className="rounded-none">
            <Inbox className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Email</h1>
        </div>
        <Button
          onClick={() => setComposeOpen(true)}
          size="sm"
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Send className="h-4 w-4 mr-1" />
          Νέο
        </Button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        <div className={`${mobileView === "folders" ? "block" : "hidden"} lg:block lg:col-span-2 min-h-0 overflow-hidden`}>
          {foldersPanel}
        </div>
        <div className={`${mobileView === "list" ? "block" : "hidden"} lg:block lg:col-span-4 min-h-0 overflow-hidden`}>
          {emailListPanel}
        </div>
        <div className={`${mobileView === "detail" ? "block" : "hidden"} lg:block lg:col-span-6 min-h-0 overflow-hidden`}>
          {detailPanel}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Το email «{deleteTarget?.subject || "(χωρίς θέμα)"}» θα μεταφερθεί στα διαγραμμένα.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {composeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl rounded-none">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Νέο Email</CardTitle>
              <Button variant="outline" size="icon" onClick={() => setComposeOpen(false)} className="rounded-none h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Προς</label>
                <Input
                  value={composeForm.to}
                  onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
                  placeholder="recipient@example.com"
                  className="rounded-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Θέμα</label>
                <Input
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Θέμα"
                  className="rounded-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Μήνυμα</label>
                <Textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  rows={8}
                  placeholder="Γράψτε το μήνυμά σας..."
                  className="rounded-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <Paperclip className="h-4 w-4" />
                  Συνημμένα
                </label>
                <input
                  ref={composeFileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => {
                    setComposeFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
                    e.target.value = "";
                  }}
                  className="sr-only"
                  aria-label="Επιλογή συνημμένων"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => composeFileInputRef.current?.click()}
                  className="mt-1 w-full justify-start rounded-none"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Επιλογή αρχείων
                </Button>
                {composeFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {composeFiles.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="flex items-center justify-between border border-border px-2 py-1 text-xs"
                      >
                        <span className="truncate">
                          {file.name} <span className="text-muted-foreground">({formatSize(file.size)})</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setComposeFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="h-7 w-7 shrink-0 rounded-none text-muted-foreground hover:text-destructive"
                          aria-label={`Αφαίρεση ${file.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setComposeOpen(false)} className="rounded-none">
                  Ακύρωση
                </Button>
                <Button
                  onClick={sendEmail}
                  disabled={sending}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Αποστολή
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
