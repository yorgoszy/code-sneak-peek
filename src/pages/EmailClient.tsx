import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Loader2,
  Mail,
  Inbox,
  Send,
  RefreshCw,
  ChevronLeft,
  X,
  Paperclip,
  ArrowLeft,
  Menu,
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
  flags: string[];
  size: number;
}

interface EmailDetail extends EmailMessage {
  raw: string;
  body: string;
  headers: Record<string, string>;
  isHtml: boolean;
}

const FUNCTION_NAME = "email-client";

async function invokeEmail(action: string, payload: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action, ...payload },
  });
  if (error) throw error;
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
  return result;
}

function formatAddress(addr?: { name?: string; address?: string }) {
  if (!addr) return "";
  return addr.name ? `${addr.name} <${addr.address}>` : addr.address || "";
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export const EmailClient: React.FC = () => {
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
  const [mobileView, setMobileView] = useState<"folders" | "list" | "detail">("folders");
  const [composeForm, setComposeForm] = useState({ to: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);

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

  const loadEmail = async (folder: string, uid: number) => {
    setLoadingEmail(true);
    try {
      const data = await invokeEmail("get-email", { folder, uid });
      setSelectedEmail(data);
      setMobileView("detail");
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err.message || "Δεν ήταν δυνατή η φόρτωση του email", variant: "destructive" });
    } finally {
      setLoadingEmail(false);
    }
  };

  const sendEmail = async () => {
    if (!composeForm.to || !composeForm.subject) {
      toast({ title: "Συμπληρώστε τα πεδία", description: "Απαιτούνται παραλήπτης και θέμα", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await invokeEmail("send-email", {
        to: composeForm.to,
        subject: composeForm.subject,
        text: composeForm.body,
      });
      toast({ title: "Αποστολή", description: "Το email στάλθηκε επιτυχώς" });
      setComposeOpen(false);
      setComposeForm({ to: "", subject: "", body: "" });
      if (selectedFolder.toLowerCase() === "sent" || selectedFolder.toLowerCase().includes("sent")) {
        loadEmails(selectedFolder);
      }
    } catch (err: any) {
      toast({ title: "Σφάλμα αποστολής", description: err.message || "Αποτυχία αποστολής", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadFolders();
      loadEmails(selectedFolder);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      loadEmails(selectedFolder);
      setSelectedEmail(null);
      setMobileView("list");
    }
  }, [selectedFolder]);

  const selectedFolderData = useMemo(() => folders.find((f) => f.path === selectedFolder), [folders, selectedFolder]);
  const isUnread = (msg: EmailMessage) => !msg.flags.includes("\\Seen");

  const foldersPanel = (
    <div className="h-full flex flex-col border-r border-border bg-background">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email
        </h2>
        <Button variant="outline" size="icon" onClick={loadFolders} disabled={loadingFolders} className="rounded-none h-8 w-8">
          <RefreshCw className={`h-4 w-4 ${loadingFolders ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.path}
              onClick={() => {
                setSelectedFolder(folder.path);
                setMobileView("list");
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between rounded-none transition-colors ${
                selectedFolder === folder.path ? "bg-[#00ffba] text-black" : "hover:bg-accent"
              }`}
            >
              <span className="truncate">{folder.name}</span>
              {(folder.status?.unseen ?? 0) > 0 && (
                <Badge className="rounded-none bg-black text-white ml-2">{folder.status?.unseen}</Badge>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-border">
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
    <div className="h-full flex flex-col bg-background">
      <div className="p-3 border-b border-border flex items-center justify-between lg:justify-start gap-2">
        <Button variant="outline" size="sm" onClick={() => setMobileView("folders")} className="lg:hidden rounded-none">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Φάκελοι
        </Button>
        <h3 className="font-semibold truncate">
          {selectedFolderData?.name || selectedFolder}
          {selectedFolderData?.status?.messages !== undefined && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({selectedFolderData.status.messages})
            </span>
          )}
        </h3>
        <Button variant="outline" size="icon" onClick={() => loadEmails(selectedFolder)} disabled={loadingEmails} className="rounded-none h-8 w-8 ml-auto">
          <RefreshCw className={`h-4 w-4 ${loadingEmails ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {loadingEmails && emails.length === 0 && (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {!loadingEmails && emails.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">Δεν βρέθηκαν emails</div>
          )}
          {emails.map((email) => (
            <button
              key={email.uid}
              onClick={() => loadEmail(selectedFolder, email.uid)}
              className={`w-full text-left p-3 hover:bg-accent transition-colors rounded-none border-l-4 ${
                selectedEmail?.uid === email.uid ? "border-[#00ffba] bg-accent" : "border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${isUnread(email) ? "font-semibold" : ""}`}>
                    {email.from.map(formatAddress).join(", ") || "(κενός αποστολέας)"}
                  </p>
                  <p className="text-sm truncate">{email.subject || "(χωρίς θέμα)"}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(email.internalDate || email.date)}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const detailPanel = (
    <div className="h-full flex flex-col bg-background">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => { setSelectedEmail(null); setMobileView("list"); }} className="lg:hidden rounded-none">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Πίσω
        </Button>
        <h3 className="font-semibold truncate">{selectedEmail?.subject || "Λεπτομέρειες"}</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        {loadingEmail && !selectedEmail && (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        {!loadingEmail && !selectedEmail && (
          <div className="text-center text-muted-foreground p-8">Επιλέξτε ένα email για προβολή</div>
        )}
        {selectedEmail && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm"><span className="font-medium">Από:</span> {selectedEmail.from.map(formatAddress).join(", ")}</p>
              <p className="text-sm"><span className="font-medium">Προς:</span> {selectedEmail.to.map(formatAddress).join(", ")}</p>
              <p className="text-sm"><span className="font-medium">Ημερομηνία:</span> {formatDate(selectedEmail.date)}</p>
            </div>
            <Separator />
            {selectedEmail.isHtml ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm">{selectedEmail.body}</pre>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setMobileView("folders")} className="rounded-none">
            <Menu className="h-5 w-5" />
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        <div className={`${mobileView === "folders" ? "block" : "hidden"} lg:block lg:col-span-3`}>{foldersPanel}</div>
        <div className={`${mobileView === "list" ? "block" : "hidden"} lg:block lg:col-span-4`}>{emailListPanel}</div>
        <div className={`${mobileView === "detail" ? "block" : "hidden"} lg:block lg:col-span-5`}>{detailPanel}</div>
      </div>

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
