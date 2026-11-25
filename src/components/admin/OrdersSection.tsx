"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  Printer,
  Ban,
  Search,
  RefreshCw,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDateTimeWIB, formatRupiah, getTodayWIB } from "@/lib/format";
import type { Order, StoreSettings } from "@/lib/types";
import { ReceiptModal } from "../ReceiptModal";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

interface OrdersSectionProps {
  initialOrders: Order[];
  settings: StoreSettings;
  onNotify: (type: "success" | "error", message: string) => void;
}

export function OrdersSection({
  initialOrders,
  settings,
  onNotify,
}: OrdersSectionProps) {
  const today = getTodayWIB();
  const cancelModalTitleId = useId();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "cancelled"
  >("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "qris">(
    "all"
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(
      `/api/orders?dateFrom=${encodeURIComponent(today)}&dateTo=${encodeURIComponent(
        today
      )}&status=all`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.orders) setOrders(d.orders);
      })
      .catch(() => {});
  }, [today]);

  useEffect(() => {
    if (!cancelTarget) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !cancelling) {
        setCancelTarget(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelTarget, cancelling]);

  async function loadOrders(
    from = dateFrom,
    to = dateTo,
    status = statusFilter
  ) {
    if (from && to && to < from) {
      onNotify(
        "error",
        "Tanggal akhir tidak boleh lebih awal dari tanggal mulai"
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(
          to
        )}&status=${status}`
      );
      if (!res.ok) {
        onNotify("error", "Gagal memuat daftar pesanan");
        return;
      }
      const data = await res.json();
      setOrders(data.orders);
      setCurrentPage(1);
    } catch {
      onNotify("error", "Koneksi gagal saat memuat pesanan");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${cancelTarget.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReason.trim() || "Dibatalkan oleh Admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Gagal membatalkan pesanan");
        return;
      }
      onNotify(
        "success",
        `Pesanan ${cancelTarget.orderNumber} dibatalkan & stok menu dikembalikan`
      );
      setCancelTarget(null);
      setCancelReason("");
      await loadOrders();
    } catch {
      onNotify("error", "Koneksi gagal saat membatalkan pesanan");
    } finally {
      setCancelling(false);
    }
  }

  const isInvalidDateRange = Boolean(dateFrom && dateTo && dateTo < dateFrom);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (paymentFilter !== "all" && o.paymentMethod !== paymentFilter) {
        return false;
      }
      if (
        q &&
        !o.orderNumber.toLowerCase().includes(q) &&
        !o.customerName.toLowerCase().includes(q) &&
        !o.cashierName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [orders, paymentFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, safePage, pageSize]);

  const startIndex =
    filteredOrders.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, filteredOrders.length);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="orders-date-from" className="sr-only">
              Tanggal mulai
            </label>
            <input
              id="orders-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
            />
            <span className="text-xs font-medium text-slate-600">s/d</span>
            <label htmlFor="orders-date-to" className="sr-only">
              Tanggal selesai
            </label>
            <input
              id="orders-date-to"
              type="date"
              min={dateFrom}
              aria-invalid={isInvalidDateRange}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`min-h-[38px] rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 ${
                isInvalidDateRange ? "border-red-600 text-red-900" : "border-slate-300"
              }`}
            />
            <label htmlFor="orders-status-filter" className="sr-only">
              Filter status pesanan
            </label>
            <select
              id="orders-status-filter"
              value={statusFilter}
              onChange={(e) => {
                const next = e.target.value as "all" | "completed" | "cancelled";
                setStatusFilter(next);
                loadOrders(dateFrom, dateTo, next);
              }}
              className="min-h-[38px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
            <label htmlFor="orders-payment-filter" className="sr-only">
              Filter metode pembayaran
            </label>
            <select
              id="orders-payment-filter"
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value as "all" | "cash" | "qris");
                setCurrentPage(1);
              }}
              className="min-h-[38px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
            </select>
            <button
              type="button"
              disabled={loading || isInvalidDateRange}
              onClick={() => loadOrders()}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                loading || isInvalidDateRange
                  ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <span>Tampilkan</span>
            </button>
          </div>

          <div className="relative w-full lg:w-64">
            <Search
              className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="orders-search" className="sr-only">
              Cari nomor order atau pelanggan
            </label>
            <input
              id="orders-search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari no order / pelanggan..."
              className="w-full min-h-[38px] rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-500 focus:border-blue-700"
            />
          </div>
        </div>

        {isInvalidDateRange && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-800"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" aria-hidden="true" />
            <span>
              Tanggal akhir tidak boleh lebih awal dari tanggal mulai.
            </span>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 text-base">
            Daftar Pesanan{" "}
            <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
              ({filteredOrders.length})
            </span>
          </h2>
          {filteredOrders.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <label htmlFor="orders-page-size" className="font-semibold">
                Tampilkan:
              </label>
              <select
                id="orders-page-size"
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

        {filteredOrders.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Tidak ada pesanan pada filter ini
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Ubah rentang tanggal, status, atau kata kunci pencarian untuk melihat transaksi lain.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {paginatedOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs font-mono text-slate-600">
                      {formatDateTimeWIB(order.createdAt)} WIB
                    </span>
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                        order.status === "completed"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status === "completed" ? "Selesai" : "Dibatalkan"}
                    </span>
                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                      {order.paymentMethod === "cash" ? "Tunai" : "QRIS"}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900">
                    {order.customerName}{" "}
                    <span className="text-xs font-normal text-slate-600">
                      • Kasir: {order.cashierName}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700">
                    {order.items
                      .map((i) => `${i.quantity}× ${i.menuName}`)
                      .join(" • ")}
                  </div>

                  {order.notes && (
                    <div className="text-xs text-slate-600">
                      Catatan: {order.notes}
                    </div>
                  )}

                  {order.status === "cancelled" && (
                    <div className="text-xs text-red-700 font-semibold">
                      Alasan batal: {order.cancelReason} (oleh{" "}
                      {order.cancelledByName})
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
                  <div className="text-left lg:text-right">
                    <div
                      className={`text-lg font-mono font-bold tabular-nums ${
                        order.status === "cancelled"
                          ? "line-through text-slate-500"
                          : "text-slate-900"
                      }`}
                    >
                      {formatRupiah(order.totalAmount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setReceiptOrder(order)}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:border-blue-700 hover:text-blue-700 text-slate-800 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Struk</span>
                    </button>

                    {order.status === "completed" && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelTarget(order);
                          setCancelReason("");
                        }}
                        className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-300 bg-red-50 hover:bg-red-700 text-red-800 hover:text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                      >
                        <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Batalkan</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Pagination Footer */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 font-mono tabular-nums">
                Menampilkan <strong>{startIndex}</strong>–
                <strong>{endIndex}</strong> dari{" "}
                <strong>{filteredOrders.length}</strong> pesanan
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

      {/* Accessible Cancel Confirmation Modal */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
          onClick={() => {
            if (!cancelling) setCancelTarget(null);
          }}
          role="presentation"
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby={cancelModalTitleId}
            onSubmit={confirmCancel}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 bg-red-50 border-b border-red-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <h2 id={cancelModalTitleId}>
                  Batalkan Pesanan {cancelTarget.orderNumber}?
                </h2>
              </div>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelTarget(null)}
                aria-label="Tutup dialog pembatalan"
                className="p-1.5 rounded-lg text-red-700 hover:bg-red-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Pesanan senilai{" "}
                <strong className="font-mono text-slate-900">
                  {formatRupiah(cancelTarget.totalAmount)}
                </strong>{" "}
                akan ditandai sebagai <strong>Dibatalkan</strong>. Stok menu yang
                terpotong oleh pesanan ini akan{" "}
                <strong className="text-emerald-800">
                  otomatis dikembalikan
                </strong>
                .
              </p>

              <div>
                <label
                  htmlFor="cancel-order-reason"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  Alasan Pembatalan
                </label>
                <input
                  id="cancel-order-reason"
                  type="text"
                  required
                  autoFocus
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Salah input menu / pelanggan batal"
                  className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-red-600"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelTarget(null)}
                className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition ${
                  cancelling
                    ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                    : "bg-red-700 hover:bg-red-800 text-white cursor-pointer"
                }`}
              >
                {cancelling ? "Membatalkan..." : "Ya, Batalkan Pesanan"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ReceiptModal
        order={receiptOrder}
        settings={settings}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
}
