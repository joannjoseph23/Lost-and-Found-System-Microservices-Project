"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/api";
import { useEffect, useState } from "react";

type LostItem = {
  id: string;
  username: string;
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

function writeLostCache(next: Record<string, LostCacheItem>) {
  try {
    localStorage.setItem("laf_lost_cache", JSON.stringify(next));
  } catch {}
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
        ? (data.error || data.message)
        : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export function UserCreateLostItem({ username }: { username: string }) {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // my items list
  const [myItems, setMyItems] = useState<LostItem[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myErr, setMyErr] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const loadMine = async () => {
    setMyLoading(true);
    setMyErr(null);

    try {
      const data = await fetchJsonWithAuth(`/lost/lost-items/user/${encodeURIComponent(username)}`, {
        method: "GET",
      });

      setMyItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMyErr(e?.message || "Failed to load your lost items");
      setMyItems([]);
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      if (!description.trim()) throw new Error("Description is required");

      let data: any = null;

      // If image selected → multipart (auth)
      if (image) {
        const token = readSessionToken();

        const fd = new FormData();
        fd.append("username", username);
        fd.append("description", description.trim());
        if (location.trim()) fd.append("location", location.trim());
        fd.append("image", image);

        const res = await fetch(`${API_BASE}/lost/lost-items`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: fd,
        });

        const text = await res.text();
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        if (!res.ok) {
          const m =
            data && typeof data === "object" && (data.error || data.message)
              ? (data.error || data.message)
              : `Request failed: ${res.status}`;
          throw new Error(m);
        }
      } else {
        // ✅ No image → JSON POST (also auth)
        data = await fetchJsonWithAuth(`/lost/lost-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            description: description.trim(),
            location: location.trim() || null,
          }),
        });
      }

      const newId = data?.id ?? "unknown";
      setMsg(`Lost item created (id: ${newId})`);

      // Save to local cache (helps match UI show lost photo)
      const cache = readLostCache();
      cache[newId] = {
        id: newId,
        description: description.trim(),
        location: location.trim() || undefined,
        createdAt: data?.createdAt,
        imagePath: data?.imagePath ?? null,
      };
      writeLostCache(cache);

      // reset form
      setDescription("");
      setLocation("");
      setImage(null);

      // refresh list
      await loadMine();
    } catch (e: any) {
      setErr(e?.message || "Failed to create lost item");
    } finally {
      setLoading(false);
    }
  };

  // NOTE: This will 403 unless you also allow USER DELETE in gateway (or make delete ADMIN-only UI).
  const deleteMine = async (id: string) => {
    if (!confirm("Delete this lost item?")) return;

    setMyErr(null);
    try {
      await fetchJsonWithAuth(`/lost/lost-items/${id}`, { method: "DELETE" });
      await loadMine();
    } catch (e: any) {
      setMyErr(e?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* CREATE FORM */}
      <div className="max-w-xl space-y-3">
        <p className="text-sm text-muted-foreground">Describe what you lost.</p>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="min-h-[120px] w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Black bottle, brand Turbo…"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Canteen / Library"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Optional Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />

          {previewUrl && (
            <div className="mt-2 w-44 h-28 rounded-md overflow-hidden border border-border bg-muted">
              <img src={previewUrl} alt="Lost preview" className="w-full h-full object-cover" />
            </div>
          )}
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

      {/* MY SUBMITTED LOST ITEMS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">My submitted lost items</div>
          <button className="text-sm underline text-primary" onClick={loadMine}>
            Refresh
          </button>
        </div>

        {myErr && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {myErr}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {myLoading ? "Loading…" : `${myItems.length} items`}
        </div>

        <div className="space-y-3">
          {myItems.map((it) => {
            const img = it.imagePath ? `${API_BASE}${it.imagePath}` : null;

            return (
              <div key={it.id} className="rounded-lg border border-border p-4">
                <div className="flex gap-4">
                  <div className="w-40 shrink-0">
                    <div className="aspect-video rounded-md bg-muted overflow-hidden flex items-center justify-center">
                      {img ? (
                        <img src={img} alt="Lost" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xs text-muted-foreground">No photo</div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    {it.location && <div className="text-sm text-muted-foreground">{it.location}</div>}
                    {it.description && <div className="text-sm">{it.description}</div>}
                    <div className="text-xs text-muted-foreground">ID: {it.id}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {!myLoading && !myErr && myItems.length === 0 && (
            <div className="text-sm text-muted-foreground">You haven’t submitted any lost items yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
