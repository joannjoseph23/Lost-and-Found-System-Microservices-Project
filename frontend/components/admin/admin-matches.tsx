"use client";

import { Card } from "@/components/ui/card";
import { API_BASE, apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type Match = {
  id: string;
  lostItemId: string;
  foundItemId: string;
  lostUsername: string;
  score: number;
  reason?: string | null;
};

type FoundItem = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  imagePath?: string | null;
};

type LostItem = {
  id: string;
  description?: string | null;
  location?: string | null;
  imagePath?: string | null;
};

/* ---------- SCORE BAR (out of 5) ---------- */
function ScoreBar5({ score }: { score: number }) {
  const max = 5;
  const s = Number.isFinite(score) ? score : 0;
  const clamped = Math.max(0, Math.min(max, s));
  const pct = Math.round((clamped / max) * 100);

  return (
    <div className="w-44">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Match score</span>
        <span>
          {clamped} / {max}
        </span>
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

export function AdminMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [foundMap, setFoundMap] = useState<Record<string, FoundItem>>({});
  const [lostMap, setLostMap] = useState<Record<string, LostItem>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const ms: Match[] = await apiFetch("/match/matches", { method: "GET" });
      setMatches(Array.isArray(ms) ? ms : []);

      // ---------- load found items ----------
      const foundIds = [...new Set(ms.map((m) => m.foundItemId))];
      const foundResults = await Promise.all(
        foundIds.map(async (id) => {
          try {
            const f = await apiFetch(`/found/found-items/${id}`);
            return [id, f] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );

      const fm: Record<string, FoundItem> = {};
      for (const [id, f] of foundResults) if (f) fm[id] = f;
      setFoundMap(fm);

      // ---------- load lost items ----------
      // NOTE: if your lost-service doesn't support GET /lost-items/{id},
      // replace this section with a single GET list and map-by-id.
      const lostIds = [...new Set(ms.map((m) => m.lostItemId))];
      const lostResults = await Promise.all(
        lostIds.map(async (id) => {
          try {
            const l = await apiFetch(`/lost/lost-items/${id}`);
            return [id, l] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );

      const lm: Record<string, LostItem> = {};
      for (const [id, l] of lostResults) if (l) lm[id] = l;
      setLostMap(lm);
    } catch (e: any) {
      setErr(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const runMatching = async () => {
    setRunning(true);
    setRunMsg(null);
    try {
      const created = await apiFetch("/match/matches/run", { method: "POST" });
      setRunMsg(
        Array.isArray(created)
          ? `Matching complete — ${created.length} new matches`
          : "Matching complete"
      );
      await load();
    } catch (e: any) {
      setRunMsg(e.message || "Failed to run matching");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground">
          {loading ? "Loading…" : `${matches.length} matches`}
        </p>

        <div className="flex gap-2">
          <button className="text-sm underline text-primary" onClick={load}>
            Refresh
          </button>

          <button
            onClick={runMatching}
            disabled={running}
            className="rounded-md border px-3 py-1 text-sm font-medium
                       border-border bg-primary text-primary-foreground
                       hover:opacity-90 disabled:opacity-50"
          >
            {running ? "Running…" : "Run Matching"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {err}
        </div>
      )}

      {runMsg && (
        <div className="rounded-md border border-border bg-muted p-3 text-sm">
          {runMsg}
        </div>
      )}

      {/* MATCH LIST */}
      <div className="space-y-4">
        {matches.map((m) => {
          const found = foundMap[m.foundItemId];
          const lost = lostMap[m.lostItemId];

          const foundImg = found?.imagePath ? `${API_BASE}${found.imagePath}` : null;
          const lostImg = lost?.imagePath ? `${API_BASE}${lost.imagePath}` : null;

          return (
            <Card key={m.id} className="p-4">
              <div className="flex gap-4">
                {/* IMAGES SIDE-BY-SIDE */}
                <div className="flex gap-3 shrink-0">
                  <div className="w-44 h-32 bg-muted rounded overflow-hidden">
                    {foundImg ? (
                      <img
                        src={foundImg}
                        alt={found?.title || "Found item"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No found photo
                      </div>
                    )}
                  </div>

                  <div className="w-44 h-32 bg-muted rounded overflow-hidden">
                    {lostImg ? (
                      <img
                        src={lostImg}
                        alt={"Lost item"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No lost photo
                      </div>
                    )}
                  </div>
                </div>

                {/* DETAILS */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-semibold">
                      {found?.title ?? "Found Item"}
                    </div>

                    {/* ✅ now shows 2/5 */}
                    <ScoreBar5 score={m.score} />
                  </div>

                  {found?.location && (
                    <div className="text-sm text-muted-foreground">
                      Found @ {found.location}
                    </div>
                  )}

                  {found?.description && (
                    <div className="text-sm">
                      <b>Found:</b> {found.description}
                    </div>
                  )}

                  {lost?.description && (
                    <div className="text-sm">
                      <b>Lost:</b> {lost.description}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    User: {m.lostUsername}
                  </div>

                  {m.reason && (
                    <div className="text-xs text-muted-foreground">
                      {m.reason}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
