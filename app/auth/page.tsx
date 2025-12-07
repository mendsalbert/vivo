"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError(
        "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    supabase.auth
      .getUser()
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error("Error getting user:", error);
          return;
        }
        setUserEmail(data.user?.email ?? null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUserEmail(session?.user?.email ?? null);
      if (session?.user) {
        // Redirect to home after successful auth
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignUp = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      alert("Check your email to confirm your account.");
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  const handleGmailSignIn = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      // Always use current origin - works for both localhost and production
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Gmail sign in failed");
      setLoading(false);
    }
  };

  const handleSSOSignIn = async () => {
    if (!email.trim()) {
      setError("Please enter your work email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/scalekit/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate SSO");
      }

      // Redirect to SSO provider
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      setError(err.message || "SSO sign in failed");
      setLoading(false);
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Configuration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">
              Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL
              and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Vivo Health</CardTitle>
          <CardDescription>
            Access your lab reports, health notes, and AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userEmail ? (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Signed in as <span className="font-medium">{userEmail}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  You can access your profile and sign out from the user menu in
                  the top right corner of the app.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="flex-1"
                >
                  Sign out
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                type="button"
                className="w-full"
                onClick={handleGmailSignIn}
                disabled={loading}
              >
                <Mail className="mr-2 h-4 w-4" />
                Continue with Gmail
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or use SSO
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSSOSignIn();
                    }
                  }}
                  disabled={loading}
                />
                <Button
                  onClick={handleSSOSignIn}
                  variant="outline"
                  className="w-full"
                  disabled={loading || !email.trim()}
                >
                  Sign in with SSO
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  For organizations using Google Workspace, Microsoft, or Okta
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email && password) {
                      handleSignIn();
                    }
                  }}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email && password) {
                      handleSignIn();
                    }
                  }}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSignIn}
                  disabled={loading || !email || !password}
                >
                  Sign in
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleSignUp}
                  disabled={loading || !email || !password}
                >
                  Sign up
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
