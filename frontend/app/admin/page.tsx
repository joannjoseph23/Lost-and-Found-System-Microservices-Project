"use client";

import { AdminFoundItems } from "@/components/admin/admin-found-items";
import { AdminLostItems } from "@/components/admin/admin-lost-items";
import { AdminMatches } from "@/components/admin/admin-matches";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearSession, getSession, Session } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Tab = "found" | "lost" | "matches";

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("found");

  useEffect(() => {
    setMounted(true);
    const s = getSession();
    if (!s) return router.replace("/login");
    if (s.role !== "ADMIN") return router.replace("/user");
    setSession(s);
  }, [router]);

  const header = useMemo(() => {
    if (!session) return null;
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Logged in as <b>{session.username}</b> ({session.role})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/user")}>
            Go to User
          </Button>
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
            <CardTitle>Admin Actions</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={tab === "found" ? "default" : "outline"}
                onClick={() => setTab("found")}
              >
                Found Items
              </Button>
              <Button
                variant={tab === "lost" ? "default" : "outline"}
                onClick={() => setTab("lost")}
              >
                Lost Items
              </Button>
              <Button
                variant={tab === "matches" ? "default" : "outline"}
                onClick={() => setTab("matches")}
              >
                View Matches
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {tab === "found" && <AdminFoundItems />}
            {tab === "lost" && <AdminLostItems />}
            {tab === "matches" && <AdminMatches />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
