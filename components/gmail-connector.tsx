"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EmailResult {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
}

export function GmailConnector() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<EmailResult[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // For this MVP, we only generate a Scalekit authorization URL
      const response = await fetch("/api/scalekit/gmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_authorization_url",
        }),
      });

      const data = await response.json();

      if (!data.success || !data.data?.link) {
        throw new Error(data.error || "Failed to get authorization URL");
      }

      // Redirect user to Scalekit-hosted auth page
      window.location.href = data.data.link;

      // For this MVP, we optimistically mark as "connected"
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to connect Gmail:", error);
      alert("Failed to connect Gmail. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchReports = async () => {
    // For this MVP, fetching via Agent Actions is not wired yet.
    alert(
      "Fetching lab reports from Gmail via Scalekit Agent Actions is not yet implemented in this demo. The UI is ready for when the API details are available."
    );
  };

  // Check if already connected on mount
  useEffect(() => {
    // In a real app, you'd check session / backend state.
    // For this MVP, we leave it as false until user clicks connect.
  }, []);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          Connect Gmail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Lab Reports from Gmail</DialogTitle>
          <DialogDescription>
            Connect your Gmail account to automatically import lab report emails
            and attachments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!isConnected ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Connect Gmail Account
                </CardTitle>
                <CardDescription>
                  Securely connect your Gmail to automatically fetch lab reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Connect Gmail
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Your Gmail credentials are encrypted and stored securely. We
                  only access emails related to lab reports and test results.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Gmail Connected</span>
                </div>
                <Button
                  onClick={handleFetchReports}
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Fetch Lab Reports
                    </>
                  )}
                </Button>
              </div>

              {emails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">
                    Found {emails.length} Lab Report Emails
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {emails.map((email) => (
                      <Card key={email.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {email.subject}
                              </p>
                              {email.hasAttachments && (
                                <Badge variant="outline" className="text-xs">
                                  <Download className="h-3 w-3 mr-1" />
                                  PDF
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {email.from}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {email.date}
                            </p>
                            {email.snippet && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {email.snippet}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            Import
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {emails.length === 0 && !isLoading && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      No lab report emails found. Click "Fetch Lab Reports" to
                      search your inbox.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
