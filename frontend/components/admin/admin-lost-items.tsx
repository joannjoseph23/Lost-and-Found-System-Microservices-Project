"use client";

import { Card } from "@/components/ui/card";
import { API_BASE, apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type LostItem = {
  id: string;
  username: string;
  description?: string | null;
  location?: string | null;
  createdAt?: string;
  imagePath?: string | null; // ✅ add this
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
        <p className="text-muted-foreground">
          {loading ? "Loading…" : `${items.length} lost items`}
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

      <div className="space-y-3">
        {items.map((it) => {
          const img = it.imagePath ? `${API_BASE}${it.imagePath}` : null;

          return (
            <Card key={it.id} className="p-4">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-44">
                  <div className="aspect-video rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center">
                    {img ? (
                      <img
                        src={img}
                        alt={`Lost item ${it.id}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground">No photo</div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{it.username}</div>
                  </div>

                  {it.location && (
                    <div className="text-sm text-muted-foreground mt-1">{it.location}</div>
                  )}

                  {it.description && <div className="text-sm mt-2">{it.description}</div>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
