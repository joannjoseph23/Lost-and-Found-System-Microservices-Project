"use client";

import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type LostItem = {
  id: string;
  username: string;
  description?: string | null;
  location?: string | null;
  createdAt?: string;
};

export function AdminLostItems() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiFetch("/lost/lost-items", { method: "GET" });
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e.message || "Failed to load lost items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">{loading ? "Loading…" : `${items.length} lost items`}</p>
        <button className="text-sm underline text-primary" onClick={load}>Refresh</button>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {err}
        </div>
      )}

      <div className="space-y-3">
        {items.map((it) => (
          <Card key={it.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{it.username}</div>
            </div>
            {it.location && <div className="text-sm text-muted-foreground mt-1">{it.location}</div>}
            {it.description && <div className="text-sm mt-2">{it.description}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}
