import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminStorageStats, type AdminImage } from "@/lib/api";
import {
  HardDrive, Trash2, RefreshCw, Image as ImageIcon,
  AlertTriangle, CheckCircle, ArrowUpDown, X,
  FileImage, CreditCard, Shield,
} from "lucide-react";

const TYPE_LABELS: Record<string, { label: string; icon: typeof FileImage; color: string }> = {
  draw: { label: "Draw Image", icon: FileImage, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  payment: { label: "Payment Proof", icon: CreditCard, color: "text-green-400 bg-green-400/10 border-green-400/20" },
  other: { label: "Other", icon: Shield, color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
};

function StorageBar({ pct, used, limit }: { pct: number; used: number; limit: number }) {
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-[#FFD700]";
  return (
    <div className="space-y-2">
      <div className="h-3 bg-white/8 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{used.toFixed(1)} MB used</span>
        <span>{limit} MB limit</span>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  image,
  onConfirm,
  onCancel,
  deleting,
}: {
  image: AdminImage;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#13131f] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base">Delete Image?</h3>
            <p className="text-zinc-400 text-sm mt-1">
              Are you sure you want to delete{" "}
              <span className="text-white font-medium break-all">{image.filename}</span>?
              {image.inUse && (
                <span className="block mt-2 text-yellow-400 text-xs">
                  Warning: This image is currently in use by "{image.usedByLabel}".
                </span>
              )}
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              This action cannot be undone. The file will be permanently deleted and storage freed.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Deleting…</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageRow({
  image,
  onDelete,
}: {
  image: AdminImage;
  onDelete: (img: AdminImage) => void;
}) {
  const typeMeta = TYPE_LABELS[image.type] ?? TYPE_LABELS.other;
  const TypeIcon = typeMeta.icon;
  const date = new Date(image.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/4 transition-colors group border border-transparent hover:border-white/8">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/8 shrink-0 flex items-center justify-center">
        <img
          src={image.url}
          alt={image.filename}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.classList.add("!flex");
          }}
        />
        <ImageIcon className="w-5 h-5 text-zinc-600 hidden" />
      </div>

      {/* Type badge */}
      <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium shrink-0 ${typeMeta.color}`}>
        <TypeIcon className="w-3 h-3" />
        {typeMeta.label}
      </div>

      {/* Filename + in-use */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate">{image.filename}</p>
        {image.inUse && image.usedByLabel && (
          <p className="text-yellow-400 text-[10px] mt-0.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            In use: {image.usedByLabel}
          </p>
        )}
      </div>

      {/* Size */}
      <span className="text-zinc-400 text-xs shrink-0 hidden md:block">{image.fileSizeLabel}</span>

      {/* Date */}
      <span className="text-zinc-500 text-xs shrink-0 hidden lg:block">{date}</span>

      {/* Delete */}
      <button
        onClick={() => onDelete(image)}
        className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        title="Delete image"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

type Notification = { type: "success" | "error" | "warn"; message: string; detail?: string };

export default function AdminStoragePage() {
  const [stats, setStats] = useState<AdminStorageStats | null>(null);
  const [images, setImages] = useState<AdminImage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<AdminImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const LIMIT = 24;

  function showNotification(n: Notification, autoDismissMs = 5000) {
    setNotification(n);
    setTimeout(() => setNotification(null), autoDismissMs);
  }

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [s, r] = await Promise.all([
        adminApi.storageStats(),
        adminApi.images({ type: filterType, sort: sortBy, page, limit: LIMIT }),
      ]);
      setStats(s);
      setImages(r.images);
      setTotal(r.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, sortBy, page]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const targetFilename = toDelete.filename;
    try {
      const result = await adminApi.deleteImage(targetFilename);
      setToDelete(null);
      await load(true);

      if (result.ok) {
        const detail = [
          result.fileDeleted ? "✓ File removed from storage" : "⚠ File was already absent from disk",
          result.dbDeleted ? "✓ Record removed from database" : "⚠ Database record could not be verified",
        ].join("  ·  ");
        showNotification({ type: "success", message: result.message ?? "Image permanently deleted from database and storage", detail });
      } else {
        showNotification({ type: "warn", message: result.message ?? "Partial deletion", detail: result.error }, 8000);
      }
    } catch (e: any) {
      console.error("[DELETE] Error:", e);
      const msg = e?.message ?? "Failed to delete image";
      showNotification({ type: "error", message: "Deletion failed — image was NOT removed", detail: msg }, 8000);
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);
  const pct = stats?.percentageUsed ?? 0;
  const barColor = pct >= 90 ? "text-red-400" : pct >= 70 ? "text-yellow-400" : "text-[#FFD700]";

  return (
    <AdminLayout title="Storage Manager">
      {toDelete && (
        <DeleteConfirmModal
          image={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          deleting={deleting}
        />
      )}

      {/* ── Notification banner ── */}
      {notification && (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 mb-4 border text-sm ${
          notification.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : notification.type === "warn"
            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <div className="shrink-0 mt-0.5">
            {notification.type === "success"
              ? <CheckCircle className="w-4 h-4" />
              : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{notification.message}</p>
            {notification.detail && (
              <p className="text-xs mt-0.5 opacity-80 font-mono">{notification.detail}</p>
            )}
          </div>
          <button onClick={() => setNotification(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Storage usage card */}
          <div className="md:col-span-2 bg-[#13131f] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h2 className="text-white font-bold">Storage Usage</h2>
                  <p className="text-zinc-500 text-xs">500 MB limit</p>
                </div>
              </div>
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loading ? (
              <div className="h-20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin" />
              </div>
            ) : stats ? (
              <>
                <div className="flex items-end gap-2 mb-4">
                  <span className={`text-3xl font-black ${barColor}`}>{stats.totalSizeMb.toFixed(1)}</span>
                  <span className="text-zinc-500 text-sm mb-1">/ {stats.storageLimitMb} MB used</span>
                  <span className={`ml-auto text-lg font-bold ${barColor}`}>{stats.percentageUsed}%</span>
                </div>
                <StorageBar pct={stats.percentageUsed} used={stats.totalSizeMb} limit={stats.storageLimitMb} />
                {stats.percentageUsed >= 90 && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Storage is almost full. Delete unused images to free up space.
                  </div>
                )}
                {stats.percentageUsed >= 70 && stats.percentageUsed < 90 && (
                  <div className="mt-3 flex items-center gap-2 text-yellow-400 text-xs bg-yellow-500/10 px-3 py-2 rounded-xl border border-yellow-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Storage usage is high. Consider removing old payment proofs.
                  </div>
                )}
              </>
            ) : (
              <p className="text-zinc-500 text-sm">Failed to load storage stats.</p>
            )}
          </div>

          {/* Image count card */}
          <div className="bg-[#13131f] border border-white/8 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Total Images</p>
                <p className="text-white font-black text-2xl">{stats?.totalImages ?? "—"}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Draw images</span>
                <span className="text-white">{images.filter(i => i.type === "draw").length}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment proofs</span>
                <span className="text-white">{images.filter(i => i.type === "payment").length}</span>
              </div>
              <div className="flex justify-between">
                <span>Other</span>
                <span className="text-white">{images.filter(i => i.type === "other").length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Image List ── */}
        <div className="bg-[#13131f] border border-white/8 rounded-2xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/8">
            <h2 className="text-white font-bold flex-1">Images</h2>

            {/* Type filter */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {(["all", "draw", "payment", "other"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setFilterType(t); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterType === t ? "bg-[#FFD700] text-black" : "text-zinc-400 hover:text-white"}`}
                >
                  {t === "all" ? "All" : TYPE_LABELS[t]?.label ?? t}
                </button>
              ))}
            </div>

            {/* Sort */}
            <button
              onClick={() => setSortBy(s => s === "date" ? "size" : "date")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort: {sortBy === "date" ? "Newest" : "Largest"}
            </button>
          </div>

          {/* Column headers */}
          <div className="hidden md:flex items-center gap-3 px-3 py-2 border-b border-white/5 text-zinc-600 text-xs">
            <div className="w-12 shrink-0" />
            <div className="w-28 shrink-0 hidden sm:block">Type</div>
            <div className="flex-1">Filename</div>
            <div className="w-20 shrink-0">Size</div>
            <div className="w-28 shrink-0 hidden lg:block">Uploaded</div>
            <div className="w-10 shrink-0" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/4 px-2 py-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-12 h-12 bg-white/5 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-48" />
                    <div className="h-2 bg-white/5 rounded w-24" />
                  </div>
                </div>
              ))
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                <ImageIcon className="w-10 h-10 mb-3" />
                <p className="text-sm font-medium">No images found</p>
                <p className="text-xs mt-1">Upload images through the draw or payment forms</p>
              </div>
            ) : (
              images.map(img => (
                <ImageRow key={img.filename} image={img} onDelete={setToDelete} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
              <span className="text-zinc-500 text-xs">{total} total images</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="text-zinc-400 text-xs">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
