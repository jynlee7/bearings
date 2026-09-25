import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Bearings" },
      {
        name: "description",
        content: "Sign in to Bearings to check in around Berkeley and earn XP.",
      },
      { property: "og:title", content: "Sign in — Bearings" },
      {
        property: "og:description",
        content: "Sign in to Bearings to check in around Berkeley and earn XP.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<"google" | "email" | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/map", replace: true });
    });
  }, [navigate]);

  async function handleGoogle() {
    setLoading("google");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(null);
      toast.error("Google sign-in didn't work. Try the email link instead.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/map", replace: true });
  }

  async function handleMagicLink(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading("email");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="sun-wash flex min-h-screen flex-col px-6 py-10">
      <Link to="/" className="flex items-center gap-2">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Compass className="size-5" />
        </span>
        <span className="font-display text-xl font-bold">Bearings</span>
      </Link>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="surface-card p-6">
          <h1 className="font-display text-2xl font-extrabold text-primary">
            Welcome back, explorer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Berkeley students get extra spots on the map.
          </p>

          <Button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="mt-6 h-12 w-full rounded-full text-base font-bold"
          >
            {loading === "google" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Continue with Google"
            )}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or use an email link
            <span className="h-px flex-1 bg-border" />
          </div>

          {sent ? (
            <div className="rounded-xl bg-secondary p-4 text-center text-sm">
              <Mail className="mx-auto mb-2 size-5 text-primary" />
              Check <strong>{email}</strong> for your sign-in link.
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@berkeley.edu"
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                disabled={loading !== null}
                className="h-12 w-full rounded-full text-base font-bold"
              >
                {loading === "email" ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  "Email me a link"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
