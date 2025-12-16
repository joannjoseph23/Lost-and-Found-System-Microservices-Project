"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

import { useEffect, useState } from "react";

type FoundItem = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  imagePath?: string | null; // "/uploads/xxx.jpg"
};

export function UserFoundItems() {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiFetch("/found/found-items", { method: "GET" });
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e.message || "Failed to load found items");
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
        <p className="text-muted-foreground">
          {loading ? "Loading…" : `${items.length} found items`}
        </p>
        <button className="text-sm underline text-primary" onClick={load}>
          Refresh
        </button>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          // because found-service serves /uploads/** directly
          const img = it.imagePath ? `${API_BASE}${it.imagePath}` : null;

          return (
            <Card key={it.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="aspect-video bg-muted rounded mb-3 overflow-hidden flex items-center justify-center">
                {img ? (
                  <img src={img} alt={it.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium truncate">{it.title}</h4>
                <Badge variant="secondary" className="shrink-0">
                  {it.status || "AVAILABLE"}
                </Badge>
              </div>

              {it.location && <p className="text-sm text-muted-foreground mt-1">{it.location}</p>}
              {it.description && (
                <p className="text-sm mt-2 text-foreground/90 line-clamp-3">
                  {it.description}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
