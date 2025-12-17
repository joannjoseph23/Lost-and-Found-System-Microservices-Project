"use client";

import { Button } from "@/components/ui/button";
import { setSession } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const r = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Login failed");

      setSession({
        token: data.token,
        username: data.username,
        role: data.role,
      });

      router.replace(data.role === "ADMIN" ? "/admin" : "/user");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ---------- WELCOME / INFO ---------- */}
        <div className="rounded-xl border border-border bg-card p-8 space-y-5">
          <h1 className="text-3xl font-bold">
            MSRIT Lost &amp; Found Online
          </h1>

          <p className="text-muted-foreground">
            A centralized platform for students and staff to report lost items,
            view found items, and automatically match them using smart keyword
            matching.
          </p>

          <div className="space-y-2 text-sm">
            <p>
              📍 <b>Location:</b> Apex Building, Level 5 (Staff Room)
            </p>
            <p>
              🧾 All <b>found items</b> listed here are physically available at
              the above location.
            </p>
            <p>
              🔍 To <b>claim a found item</b>, your lost item description must
              match the found item, and valid proof must be provided.
            </p>
            <p>
              📧 For queries, contact the admin at{" "}
              <a
                href="mailto:admin@admingmail"
                className="underline text-primary"
              >
                admin@admingmail
              </a>
            </p>
          </div>

          <div className="pt-2 text-sm text-muted-foreground">
            This system demonstrates a microservices-based architecture with
            authentication, role-based access, image uploads, and automated
            matching.
          </div>
        </div>

        {/* ---------- LOGIN ---------- */}
        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold mb-1">Sign in</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Gateway: {API_BASE}
          </p>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <input
                className="mt-1 h-10 w-full rounded-md border border-border bg-input px-3 text-sm outline-none focus:ring-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                className="mt-1 h-10 w-full rounded-md border border-border bg-input px-3 text-sm outline-none focus:ring-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <Link className="text-primary underline" href="/register">
              Register
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
