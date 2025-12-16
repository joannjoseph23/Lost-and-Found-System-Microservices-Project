"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCreateLostItem } from "@/components/user/user-create-lost-item";
import { UserFoundItems } from "@/components/user/user-found-items";
import { UserMyMatches } from "@/components/user/user-my-matches";
import { clearSession, getSession, Session } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Tab = "found" | "lost" | "matches";

export default function UserPage() {
  const router = useRouter();
  const [session, setSessionState] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("found");

  useEffect(() => {
    setMounted(true);
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    // USER page is fine for both roles, but keep it user-focused:
    setSessionState(s);
  }, [router]);

  const header = useMemo(() => {
    if (!session) return null;
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">User Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Logged in as <b>{session.username}</b> ({session.role})
          </p>
        </div>

        <div className="flex gap-2">
          {session.role === "ADMIN" && (
            <Button variant="outline" onClick={() => router.push("/admin")}>
              Go to Admin
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    );
  }, [session, router]);

  if (!mounted) return null;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-6">
        {header}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Actions</CardTitle>
            <div className="flex gap-2">
              <Button variant={tab === "found" ? "default" : "outline"} onClick={() => setTab("found")}>
                Found Items
              </Button>
              <Button variant={tab === "lost" ? "default" : "outline"} onClick={() => setTab("lost")}>
                Create Lost Item
              </Button>
              <Button variant={tab === "matches" ? "default" : "outline"} onClick={() => setTab("matches")}>
                My Matches
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {tab === "found" && <UserFoundItems />}
            {tab === "lost" && <UserCreateLostItem username={session.username} />}
            {tab === "matches" && <UserMyMatches username={session.username} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
