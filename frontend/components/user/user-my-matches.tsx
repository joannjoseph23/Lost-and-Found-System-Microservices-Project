"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { API_BASE, apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type Match = {
  id: string;
  lostItemId: string;
  foundItemId: string;
  lostUsername: string;
  score: number;
  reason?: string | null;
  createdAt?: string;
};

type FoundItem = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  imagePath?: string | null; // "/uploads/xxx.jpg"
};

type LostCacheItem = {
  id: string;
  description?: string;
  location?: string;
  createdAt?: string;
};

function readLostCache(): Record<string, LostCacheItem> {
  try {
    const raw = localStorage.getItem("laf_lost_cache");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function UserMyMatches({ username }: { username: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [foundMap, setFoundMap] = useState<Record<string, FoundItem>>({});
  const [lostCache, setLostCache] = useState<Record<string, LostCacheItem>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);

    try {
      const data = await apiFetch(`/match/matches/by-user/${username}`, { method: "GET" });
      const ms: Match[] = Array.isArray(data) ? data : [];
      setMatches(ms);

      // read local lost cache (for descriptions)
      setLostCache(readLostCache());

      // fetch found items for all matches (dedup)
      const ids = Array.from(new Set(ms.map((m) => m.foundItemId)));
      const results = await Promise.allSettled(
        ids.map((id) => apiFetch(`/found/found-items/${id}`, { method: "GET" }))
      );

      const next: Record<string, FoundItem> = {};
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") next[ids[idx]] = r.value as FoundItem;
      });
      setFoundMap(next);
    } catch (e: any) {
      setErr(e.message || "Failed to load matches");
      setMatches([]);
      setFoundMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => matches, [matches]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {loading ? "Loading…" : `${rows.length} matches`}
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

      <div className="space-y-4">
        {rows.map((m) => {
          const f = foundMap[m.foundItemId];
          const lost = lostCache[m.lostItemId];

          const img = f?.imagePath ? `${API_BASE}/found${f.imagePath}` : null;

          return (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium text-lg">Match</div>
                <Badge variant="secondary">Score: {m.score}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Found side */}
                <div className="rounded-lg border border-border p-3">
                  <div className="text-sm font-medium mb-2">Found Item</div>

                  <div className="aspect-video bg-muted rounded mb-3 overflow-hidden flex items-center justify-center">
                    {img ? (
                      <img src={img} alt={f?.title ?? "Found"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>

                  <div className="text-sm">
                    <div className="font-medium">{f?.title ?? m.foundItemId}</div>
                    {f?.location && <div className="text-muted-foreground mt-1">{f.location}</div>}
                    {f?.description && <div className="mt-2">{f.description}</div>}
                  </div>
                </div>

                {/* Lost side */}
                <div className="rounded-lg border border-border p-3">
                  <div className="text-sm font-medium mb-2">Your Lost Item</div>

                  <div className="text-sm text-muted-foreground">
                    <div><span className="text-foreground/90">ID:</span> {m.lostItemId}</div>
                    {lost?.location && <div className="mt-1"><span className="text-foreground/90">Location:</span> {lost.location}</div>}
                    {lost?.description ? (
                      <div className="mt-2 text-foreground/90">{lost.description}</div>
                    ) : (
                      <div className="mt-2 italic">
                        (Lost description not available — only newly created lost items are cached locally.)
                      </div>
                    )}
                  </div>

                  {m.reason && (
                    <div className="mt-3 text-sm">
                      <div className="text-muted-foreground">Reason</div>
                      <div className="mt-1">{m.reason}</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {!loading && !err && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No matches yet. Create a lost item and wait for matching (or ask admin to run it).
          </div>
        )}
      </div>
    </div>
  );
}
