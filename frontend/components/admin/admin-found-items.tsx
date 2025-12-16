"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE, apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";

type FoundItem = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  imagePath?: string | null;
  keywords?: string[] | null;
};

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Uploading…</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

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
              <img src={img} alt={item.title} className="w-full h-full object-cover" />
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
              {item.description ? item.description : <span className="text-muted-foreground">—</span>}
            </div>

            <div className="text-sm">
              <b>Keywords:</b>{" "}
              {item.keywords?.length ? item.keywords.join(", ") : <span className="text-muted-foreground">—</span>}
            </div>

            <div className="text-sm text-muted-foreground pt-2">
              Please mail the admin <b>admin@admingmail</b> for further contact.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminFoundItems() {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // create form
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState(""); // comma separated

  const [creating, setCreating] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const [selected, setSelected] = useState<FoundItem | null>(null);

  const keywordsList = useMemo(
    () => keywords.split(",").map((s) => s.trim()).filter(Boolean),
    [keywords]
  );

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

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

  // upload with progress using XHR
  const uploadWithProgress = (fd: FormData) => {
    return new Promise<void>((resolve, reject) => {
      const session = getSession();
      if (!session?.token) return reject(new Error("Not logged in"));

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/found/found-items`);
      xhr.setRequestHeader("Authorization", `Bearer ${session.token}`);

      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        setUploadPct(Math.round((evt.loaded / evt.total) * 100));
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          try {
            const j = JSON.parse(xhr.responseText);
            reject(new Error(j?.error || `Upload failed: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(fd);
    });
  };

  const create = async () => {
    setErr(null);
    setCreating(true);
    setUploadPct(0);

    try {
      if (!image) throw new Error("Please choose an image");
      if (!title.trim()) throw new Error("Please enter title");

      const fd = new FormData();
      fd.append("image", image);
      fd.append("title", title);
      if (description) fd.append("description", description);
      if (location) fd.append("location", location);
      keywordsList.forEach((k) => fd.append("keywords", k));

      await uploadWithProgress(fd);

      setImage(null);
      setTitle("");
      setLocation("");
      setDescription("");
      setKeywords("");
      setUploadPct(0);

      await load();
    } catch (e: any) {
      setErr(e.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this found item?")) return;
    setErr(null);
    try {
      await apiFetch(`/found/found-items/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setErr(e.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* CREATE */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="font-medium">Create Found Item</div>

        {err && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />

            {/* ✅ preview */}
            {previewUrl && (
              <div className="mt-2 w-40 h-28 rounded-md overflow-hidden border border-border bg-muted">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Black Wallet" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Library" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Keywords (comma separated)</label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="black, wallet, id, library" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="min-h-[100px] w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details about where/how it was found..."
          />
        </div>

        {creating && uploadPct > 0 && uploadPct < 100 && <ProgressBar pct={uploadPct} />}

        <Button onClick={create} disabled={creating || !title.trim() || !image}>
          {creating ? "Uploading…" : "Create"}
        </Button>
      </div>

      {/* LIST */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground">
          {loading ? "Loading…" : `${items.length} found items`}
        </div>
        <button className="text-sm underline text-primary" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          const img = it.imagePath ? `${API_BASE}${it.imagePath}` : null;

          return (
            <Card
              key={it.id}
              className="
                p-4 space-y-3 cursor-pointer
                transition-all duration-200
                hover:shadow-md hover:scale-[1.02]
                hover:border-primary/50
              "
              onClick={() => setSelected(it)}
            >
              <div className="aspect-video bg-muted rounded overflow-hidden flex items-center justify-center">
                {img ? (
                  <img src={img} alt={it.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="font-medium">{it.title}</div>
                <Badge variant="secondary">{it.status || "AVAILABLE"}</Badge>
              </div>

              {/* ✅ card shows ONLY location + keywords */}
              {it.location && <div className="text-sm text-muted-foreground">{it.location}</div>}

              <div className="text-sm text-muted-foreground">
                <b>Keywords:</b>{" "}
                {it.keywords?.length ? it.keywords.join(", ") : "—"}
              </div>

              {/* stop card click when pressing delete */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    del(it.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {selected && <FoundDetailsModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
