"use client";

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
  imagePath?: string | null;
};

type LostItem = {
  id: string;
  description?: string | null;
  location?: string | null;
  createdAt?: string;
  imagePath?: string | null;
};

type LostCacheItem = {
  id: string;
  description?: string;
  location?: string;
  createdAt?: string;
  imagePath?: string | null;
};

function readLostCache(): Record<string, LostCacheItem> {
  try {
    const raw = localStorage.getItem("laf_lost_cache");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function readSessionToken(): string | null {
  try {
    const raw = localStorage.getItem("laf_session");
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.token ?? null;
  } catch {
    return null;
  }
}

async function fetchJsonWithAuth(path: string, init?: RequestInit) {
  const token = readSessionToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && (data.error || data.message)
        ? data.error || data.message
        : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

/* ---------- SCORE BAR (same idea as admin) ---------- */
function ScoreBar({ score }: { score: number }) {
  const max = 5;
  const safeScore = Math.max(0, Math.min(max, score));
  const pct = Math.round((safeScore / max) * 100);

  return (
    <div className="w-44">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Match score</span>
        <span>{safeScore} / {max}</span>
      </div>

      <div className="h-2 w-full rounded bg-muted overflow-hidden">
        <div
          className="h-full rounded bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


export function UserMyMatches({ username }: { username: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [foundMap, setFoundMap] = useState<Record<string, FoundItem>>({});
  const [lostMap, setLostMap] = useState<Record<string, LostItem>>({});
  const [lostCache, setLostCache] = useState<Record<string, LostCacheItem>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* ---------- MAX SCORE (for bar normalization) ---------- */
  const maxScore = useMemo(() => {
    const m = Math.max(0, ...matches.map((x) => Number(x.score) || 0));
    return m || 1;
  }, [matches]);

  const load = async () => {
    setLoading(true);
    setErr(null);

    try {
      // ✅ 1) matches for this user (protected → use auth fetch)
      const msRaw = await fetchJsonWithAuth(`/match/matches/by-user/${encodeURIComponent(username)}`, {
        method: "GET",
      });
      const ms: Match[] = Array.isArray(msRaw) ? msRaw : [];
      setMatches(ms);

      // local cache fallback (nice fallback for lost details)
      setLostCache(readLostCache());

      // ✅ 2) found items for these matches (GET is public, apiFetch is fine)
      const foundIds = Array.from(new Set(ms.map((m) => m.foundItemId)));
      const foundResults = await Promise.allSettled(
        foundIds.map((id) => apiFetch(`/found/found-items/${id}`, { method: "GET" }))
      );
      const nextFound: Record<string, FoundItem> = {};
      foundResults.forEach((r, idx) => {
        if (r.status === "fulfilled") nextFound[foundIds[idx]] = r.value as FoundItem;
      });
      setFoundMap(nextFound);

      // ✅ 3) lost items: fetch ALL of this user’s lost items once (protected → use auth fetch)
      const myLostRaw = await fetchJsonWithAuth(`/lost/lost-items/user/${encodeURIComponent(username)}`, {
        method: "GET",
      });
      const myLostArr: LostItem[] = Array.isArray(myLostRaw) ? myLostRaw : [];

      const nextLost: Record<string, LostItem> = {};
      myLostArr.forEach((li) => {
        if (li?.id) nextLost[li.id] = li;
      });
      setLostMap(nextLost);
    } catch (e: any) {
      setErr(e?.message || "Failed to load matches");
      setMatches([]);
      setFoundMap({});
      setLostMap({});
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
        <p className="text-muted-foreground">{loading ? "Loading…" : `${rows.length} matches`}</p>
        <button className="text-sm underline text-primary" onClick={load}>
          Refresh
        </button>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{err}</div>
      )}

      <div className="space-y-4">
        {rows.map((m) => {
          const found = foundMap[m.foundItemId];

          // ✅ lost comes from user's own list (or fallback cache)
          const lost = lostMap[m.lostItemId];
          const lostFallback = lostCache[m.lostItemId];

          const foundImg = found?.imagePath ? `${API_BASE}${found.imagePath}` : null;

          // ✅ Use lostMap first, then cache
          const lostImgPath = lost?.imagePath ?? lostFallback?.imagePath ?? null;
          const lostImg = lostImgPath ? `${API_BASE}${lostImgPath}` : null;

          return (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium text-lg">Match</div>
                {/* ✅ score bar instead of "Score: 2" */}
                <ScoreBar score={m.score} />
              </div>

              {/* ✅ Smaller photos side-by-side */}
              <div className="mt-3 flex flex-wrap gap-3">
                <div className="w-40">
                  <div className="text-xs text-muted-foreground mb-2">Found photo</div>
                  <div className="w-40 h-28 bg-muted rounded overflow-hidden flex items-center justify-center">
                    {foundImg ? (
                      <img src={foundImg} alt={found?.title ?? "Found"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xs text-muted-foreground">No found photo</div>
                    )}
                  </div>
                </div>

                <div className="w-40">
                  <div className="text-xs text-muted-foreground mb-2">Lost photo</div>
                  <div className="w-40 h-28 bg-muted rounded overflow-hidden flex items-center justify-center">
                    {lostImg ? (
                      <img src={lostImg} alt="Lost" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xs text-muted-foreground">No lost photo</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 rounded-lg border border-border p-3 space-y-2">
                <div className="text-sm">
                  <div className="font-medium">{found?.title ?? m.foundItemId}</div>
                  {found?.location && <div className="text-muted-foreground mt-1">Found @ {found.location}</div>}
                  {found?.description && <div className="mt-2">{found.description}</div>}
                </div>

                <div className="text-sm text-muted-foreground">
                  <div>
                    <span className="text-foreground/90">Location:</span>{" "}
                    {lost?.location ?? lostFallback?.location ?? "—"}
                  </div>
                  <div className="mt-1">
                    <span className="text-foreground/90">Description:</span>{" "}
                    {lost?.description ?? lostFallback?.description ?? "—"}
                  </div>
                </div>

                {m.reason && <div className="text-sm mt-1">{m.reason}</div>}
              </div>
            </Card>
          );
        })}

        {!loading && !err && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No matches yet. Create a lost item and ask admin to run matching.
          </div>
        )}
      </div>
    </div>
  );
}
