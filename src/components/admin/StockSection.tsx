"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Minus,
  History,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { formatDateTimeWIB, REASON_LABELS } from "@/lib/format";
import type { Menu, StockLog } from "@/lib/types";
import { ConfirmModal } from "../ConfirmModal";

interface StockSectionProps {
  initialStockMenus: Menu[];
  initialLogs: StockLog[];
  onNotify: (type: "success" | "error", message: string) => void;
}

interface PendingQuickAdjust {
  menu: Menu;
  amount: number;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function StockSection({
  initialStockMenus,
  initialLogs,
  onNotify,
}: StockSectionProps) {
  const [stockMenus, setStockMenus] = useState<Menu[]>(initialStockMenus);
  const [logs, setLogs] = useState<StockLog[]>(initialLogs);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Per-menu adjustment form state
  const [customInputs, setCustomInputs] = useState<
    Record<number, { qty: string; note: string }>
  >({});

  // Quick-add confirmation modal state
  const [pendingQuick, setPendingQuick] = useState<PendingQuickAdjust | null>(
    null
  );

  // Pagination state for Riwayat Pergerakan Stok
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  async function reloadStock() {
    try {
      const res = await fetch("/api/stock?limit=200");
      if (!res.ok) {
        onNotify("error", "Gagal memuat data stok terbaru");
        return;
      }
      const data = await res.json();
      setStockMenus(data.stockMenus);
      setLogs(data.logs);
    } catch {
      onNotify("error", "Koneksi gagal saat memuat data stok");
    }
  }

  useEffect(() => {
    reloadStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, safePage, pageSize]);

  const startIndex = logs.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, logs.length);

  async function handleAdjust(
    menuId: number,
    changeAmount: number,
    reason: "restock" | "adjustment",
    note: string
  ) {
    setSavingId(menuId);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, changeAmount, reason, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Gagal memperbarui stok");
        return;
      }
      onNotify("success", "Stok berhasil diperbarui");
      setCustomInputs((prev) => ({
        ...prev,
        [menuId]: { qty: "", note: "" },
      }));
      setCurrentPage(1);
      await reloadStock();
    } catch {
      onNotify("error", "Koneksi gagal saat menyimpan perubahan stok");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div>
        <h2 className="font-bold text-slate-900 text-lg">Manajemen Stok Menu</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Tambah atau kurangi stok untuk setiap menu yang mengaktifkan pelacakan stok.
        </p>
      </div>

      {/* Per-Item Stock Cards */}
      {stockMenus.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Package
            className="w-8 h-8 mx-auto mb-2 text-slate-400"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-slate-800">
            Belum ada menu dengan pelacakan stok
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Aktifkan opsi &ldquo;Hitung sisa stok&rdquo; pada menu di tab{" "}
            <strong>Menu &amp; Harga</strong> untuk mulai melacak stoknya di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stockMenus.map((menu) => {
            const form = customInputs[menu.id] ?? { qty: "", note: "" };
            const qtyNum = Math.trunc(Number(form.qty)) || 0;
            const capacityPct = Math.min(
              100,
              Math.round((menu.stock / 30) * 100)
            );

            return (
              <div
                key={menu.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-base">
                      {menu.name}
                    </h3>
                    <div className="mt-1">
                      {menu.stock === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-bold">
                          Stok Habis
                        </span>
                      ) : menu.stock <= 5 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                          Stok Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-xs font-bold">
                          Stok Aman
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums leading-none">
                      {menu.stock}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-1">
                      porsi tersisa
                    </div>
                  </div>
                </div>

                {/* Proportional Stock Capacity Bar */}
                <div
                  className="w-full h-2 rounded-full bg-slate-100 overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      menu.stock === 0
                        ? "bg-red-600"
                        : menu.stock <= 5
                        ? "bg-amber-600"
                        : "bg-emerald-600"
                    }`}
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>

                {/* Quick + Buttons (with safety confirmation) */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 mr-1">
                    Tambah cepat:
                  </span>
                  {[5, 10, 20].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={savingId === menu.id}
                      onClick={() => setPendingQuick({ menu, amount: val })}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-mono font-bold tabular-nums transition cursor-pointer"
                    >
                      +{val}
                    </button>
                  ))}
                </div>

                {/* Manual Adjustment Form */}
                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label
                        htmlFor={`stock-qty-${menu.id}`}
                        className="sr-only"
                      >
                        Jumlah penyesuaian stok {menu.name}
                      </label>
                      <input
                        id={`stock-qty-${menu.id}`}
                        type="number"
                        min={1}
                        placeholder="Jumlah"
                        value={form.qty}
                        onChange={(e) =>
                          setCustomInputs((prev) => ({
                            ...prev,
                            [menu.id]: { ...form, qty: e.target.value },
                          }))
                        }
                        className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-500 tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor={`stock-note-${menu.id}`}
                        className="sr-only"
                      >
                        Catatan penyesuaian stok {menu.name}
                      </label>
                      <input
                        id={`stock-note-${menu.id}`}
                        type="text"
                        placeholder="Catatan (misal: belanja pagi / rusak)"
                        value={form.note}
                        onChange={(e) =>
                          setCustomInputs((prev) => ({
                            ...prev,
                            [menu.id]: { ...form, note: e.target.value },
                          }))
                        }
                        className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={savingId === menu.id || qtyNum <= 0}
                      onClick={() =>
                        handleAdjust(
                          menu.id,
                          qtyNum,
                          "restock",
                          form.note || "Restock manual"
                        )
                      }
                      className={`min-h-[40px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                        savingId === menu.id || qtyNum <= 0
                          ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                          : "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                      }`}
                    >
                      <Plus
                        className="w-3.5 h-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Tambah Stok</span>
                    </button>
                    <button
                      type="button"
                      disabled={savingId === menu.id || qtyNum <= 0}
                      onClick={() =>
                        handleAdjust(
                          menu.id,
                          -qtyNum,
                          "adjustment",
                          form.note || "Pengurangan / rusak"
                        )
                      }
                      className="min-h-[40px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-red-50 hover:text-red-800 hover:border-red-300 border border-slate-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed text-slate-800 text-xs font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      <Minus
                        className="w-3.5 h-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Kurangi</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Movement Logs — Mobile Cards + Desktop Table + Pagination */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <h3 className="font-bold text-slate-900 text-base">
              Riwayat Pergerakan Stok
            </h3>
          </div>

          {logs.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <label htmlFor="stock-log-page-size" className="font-semibold">
                Tampilkan:
              </label>
              <select
                id="stock-log-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="min-h-[34px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / halaman
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-600">
            Belum ada riwayat pergerakan stok
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-200">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900">
                        {log.menuName}
                      </div>
                      <div className="text-xs font-mono text-slate-600 mt-0.5">
                        {formatDateTimeWIB(log.createdAt)} • {log.createdByName}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono font-extrabold text-sm tabular-nums ${
                          log.changeAmount > 0
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {log.changeAmount > 0
                          ? `+${log.changeAmount}`
                          : log.changeAmount}
                      </div>
                      <div className="text-xs font-mono text-slate-600 tabular-nums">
                        Sisa: {log.stockAfter}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                        log.reason === "restock"
                          ? "bg-emerald-100 text-emerald-900"
                          : log.reason === "sale"
                          ? "bg-blue-100 text-blue-900"
                          : log.reason === "cancel"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {REASON_LABELS[log.reason] || log.reason}
                    </span>
                    {log.note && (
                      <span className="text-xs text-slate-600">{log.note}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">
                    <th className="px-5 py-3">Waktu</th>
                    <th className="px-5 py-3">Menu</th>
                    <th className="px-5 py-3">Jenis</th>
                    <th className="px-5 py-3 text-right">Perubahan</th>
                    <th className="px-5 py-3 text-right">Sisa</th>
                    <th className="px-5 py-3">Catatan</th>
                    <th className="px-5 py-3">Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-xs text-slate-600 whitespace-nowrap font-mono">
                        {formatDateTimeWIB(log.createdAt)}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {log.menuName}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md whitespace-nowrap ${
                            log.reason === "restock"
                              ? "bg-emerald-100 text-emerald-900"
                              : log.reason === "sale"
                              ? "bg-blue-100 text-blue-900"
                              : log.reason === "cancel"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {REASON_LABELS[log.reason] || log.reason}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-mono font-bold tabular-nums ${
                          log.changeAmount > 0
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {log.changeAmount > 0
                          ? `+${log.changeAmount}`
                          : log.changeAmount}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {log.stockAfter}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-700">
                        {log.note}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {log.createdByName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 font-mono tabular-nums">
                Menampilkan <strong>{startIndex}</strong>–
                <strong>{endIndex}</strong> dari <strong>{logs.length}</strong>{" "}
                riwayat
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition whitespace-nowrap ${
                    safePage <= 1
                      ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-white border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Sebelumnya</span>
                </button>

                <span className="text-xs font-semibold font-mono text-slate-700 px-2 tabular-nums whitespace-nowrap">
                  Hal {safePage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={`min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition whitespace-nowrap ${
                    safePage >= totalPages
                      ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-white border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer"
                  }`}
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog for Quick Stock Additions */}
      <ConfirmModal
        open={pendingQuick !== null}
        title={
          pendingQuick
            ? `Tambah +${pendingQuick.amount} ${pendingQuick.menu.name}?`
            : ""
        }
        description={
          pendingQuick
            ? `Stok ${pendingQuick.menu.name} akan berubah dari ${pendingQuick.menu.stock} menjadi ${
                pendingQuick.menu.stock + pendingQuick.amount
              } porsi.`
            : ""
        }
        confirmLabel={
          pendingQuick ? `Ya, Tambah +${pendingQuick.amount}` : "Tambah"
        }
        tone="primary"
        loading={pendingQuick !== null && savingId === pendingQuick.menu.id}
        onClose={() => setPendingQuick(null)}
        onConfirm={async () => {
          if (!pendingQuick) return;
          const target = pendingQuick;
          setPendingQuick(null);
          await handleAdjust(
            target.menu.id,
            target.amount,
            "restock",
            `Tambah cepat +${target.amount}`
          );
        }}
      />
    </div>
  );
}
