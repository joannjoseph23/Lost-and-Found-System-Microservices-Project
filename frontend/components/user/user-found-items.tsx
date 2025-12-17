"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

type FoundItem = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  imagePath?: string | null; // "/uploads/xxx.jpg"
  keywords?: string[] | null; // may exist only on details endpoint
};

function FoundDetailsModal({
  item,
  onClose,
}: {
  item: FoundItem;
  onClose: () => void;
}) {
  const img = item.imagePath ? `${API_BASE}${item.imagePath}` : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl bg-background border border-border shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="font-semibold text-lg">{item.title}</div>
          <button className="text-sm underline text-primary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg overflow-hidden bg-muted">
            {img ? (
              <img
                src={img}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-64" />
            )}
          </div>

          <div className="space-y-2">
            {item.location && (
              <div className="text-sm text-muted-foreground">
                <b>Location:</b> {item.location}
              </div>
            )}

            <div className="text-sm">
              <b>Description:</b>{" "}
              {item.description ? (
                item.description
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>

            <div className="text-sm">
              <b>Keywords:</b>{" "}
              {item.keywords?.length ? (
                item.keywords.join(", ")
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>

            <div className="text-sm text-muted-foreground pt-2">
              Please mail the admin{" "}
              <a className="underline" href="mailto:admin@admingmail">
                admin@admingmail
              </a>{" "}
              for further contact.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserFoundItems() {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [selected, setSelected] = useState<FoundItem | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiFetch("/found/found-items", { method: "GET" });
      setItems(Array.isArray(data) ? (data as FoundItem[]) : []);
    } catch (e: any) {
      setErr(e.message || "Failed to load found items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetails = async (id: string) => {
    setErr(null);
    try {
      // fetch full item so keywords show
      const full = await apiFetch(`/found/found-items/${id}`, { method: "GET" });
      setSelected(full as FoundItem);
    } catch (e: any) {
      // fallback to list item if details call fails
      setErr(e?.message || "Failed to load item details");
      const fallback = items.find((x) => x.id === id) ?? null;
      setSelected(fallback);
    }
  };

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
          const img = it.imagePath ? `${API_BASE}${it.imagePath}` : null;

          return (
            <Card
              key={it.id}
              className="p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:border-primary/50"
              onClick={() => openDetails(it.id)}
            >
              <div className="aspect-video bg-muted rounded mb-3 overflow-hidden flex items-center justify-center">
                {img ? (
                  <img
                    src={img}
                    alt={it.title}
                    className="w-full h-full object-cover"
                  />
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

              {/* ✅ Preview shows ONLY title + description (no location, no keywords) */}
              {it.description && (
                <p className="text-sm mt-2 text-foreground/90 line-clamp-3">
                  {it.description}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {selected && (
        <FoundDetailsModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
