"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useState } from "react";

export function UserCreateLostItem({ username }: { username: string }) {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const data = await apiFetch("/lost/lost-items", {
        method: "POST",
        body: JSON.stringify({ username, description, location }),
      });

      setMsg(`Lost item created (id: ${data?.id ?? "unknown"})`);
      setDescription("");
      setLocation("");
    } catch (e: any) {
      setErr(e.message || "Failed to create lost item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-3">
      <p className="text-sm text-muted-foreground">
        Describe what you lost. This helps matching find related found items.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="min-h-[120px] w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Black wallet with college ID inside…"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Library / CSE block"
        />
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {err}
        </div>
      )}
      {msg && (
        <div className="rounded-md border border-border bg-muted p-3 text-sm">
          {msg}
        </div>
      )}

      <Button onClick={submit} disabled={loading || !description.trim()}>
        {loading ? "Submitting…" : "Submit Lost Item"}
      </Button>
    </div>
  );
}
