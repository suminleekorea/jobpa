import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Inbox, Loader2, Mail, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type GmailStatus = {
  connected: boolean;
  email: string | null;
  scopes: string | null;
  lastSyncedAt: string | null;
};

type EmailMessage = {
  id?: number;
  fromEmail?: string | null;
  subject?: string | null;
  snippet?: string | null;
  receivedAt?: string | null;
};

const STATUS_COPY: Record<string, string> = {
  connected: "Gmail connected.",
  google_not_configured: "Google OAuth is not configured yet.",
  missing_google_code: "Google did not return an authorization code.",
  invalid_google_state: "Gmail connection expired. Try connecting again.",
  gmail_connect_failed: "Gmail connection failed. Check OAuth redirect settings.",
};

export default function EmailCenter() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const callbackStatus = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get("status");
    return value ? STATUS_COPY[value] || `Status: ${value}` : "";
  }, []);

  async function loadStatus() {
    setIsLoading(true);
    try {
      const [statusRes, messagesRes] = await Promise.all([
        fetch("/api/integrations/gmail/status"),
        fetch("/api/email/messages?limit=10"),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data.messages || []);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setNotice(callbackStatus);
    void loadStatus();
  }, [callbackStatus]);

  async function syncMail() {
    setNotice("");
    setIsSyncing(true);
    try {
      const res = await fetch("/api/email/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxResults: 10 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(data.error || "Email sync failed.");
        return;
      }
      setNotice(`Synced ${data.count || 0} career-related messages.`);
      await loadStatus();
    } catch {
      setNotice("Email sync failed. Check your connection and try again.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    setNotice("");
    setIsSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(data.error || "Email send failed.");
        return;
      }
      setNotice("Email sent.");
      setTo("");
      setSubject("");
      setBody("");
    } catch {
      setNotice("Email send failed. Check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Center</h1>
          <p className="text-sm text-muted-foreground">
            Connect Gmail for interview follow-ups and career-related mail tracking.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => { window.location.href = "/api/integrations/gmail/connect"; }}
        >
          <Mail className="h-4 w-4" />
          {status?.connected ? "Reconnect Gmail" : "Connect Gmail"}
        </Button>
      </div>

      {notice && (
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
          {notice}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Connection</p>
            <p className="mt-2 text-lg font-semibold">
              {isLoading ? "Checking..." : status?.connected ? "Connected" : "Not connected"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground truncate">
              {status?.email || "No Gmail account connected"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Last sync</p>
            <p className="mt-2 text-lg font-semibold">
              {status?.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : "Never"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Career query only</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Stored messages</p>
            <p className="mt-2 text-lg font-semibold">{messages.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Recent metadata, not full bodies</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              Career Mail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={syncMail}
              disabled={!status?.connected || isSyncing}
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync career mail
            </Button>

            {messages.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                No career mail synced yet. Connect Gmail, then sync recent interview, recruiter, offer, and application emails.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div key={message.id || index} className="rounded-md border p-3">
                    <p className="font-medium line-clamp-1">{message.subject || "No subject"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{message.fromEmail || "Unknown sender"}</p>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{message.snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendEmail} className="space-y-3">
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                required
              />
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                required
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a thank-you note or follow-up email..."
                rows={9}
                required
              />
              <Button type="submit" className="gap-2" disabled={!status?.connected || isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send with Gmail
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Email access uses user-approved Gmail permissions. JobPA syncs career-related metadata for workflow help and does not guarantee employment, legal, or visa outcomes.
        </p>
      </div>
    </div>
  );
}
