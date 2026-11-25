"use client";

import { useEffect, useState } from "react";
import { Banknote, QrCode, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import {
  CATEGORY_LABELS,
  formatDateShortID,
  formatRupiah,
  getDaysAgoWIB,
  getTodayWIB,
} from "@/lib/format";
import type { CategoryItem, SalesReport } from "@/lib/types";

interface ReportsSectionProps {
  initialReport: SalesReport;
  categories?: CategoryItem[];
  onNotify?: (type: "success" | "error", message: string) => void;
}

function formatCompactRupiah(amount: number): string {
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000;
    return `Rp ${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1).replace(".", ",")}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1_000)}rb`;
  }
  return `Rp ${amount}`;
}

function formatDayTick(yyyyMmDd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd);
  if (!match) return yyyyMmDd;
  return `${Number(match[3])}/${Number(match[2])}`;
}

export function ReportsSection({
  initialReport,
  categories = [],
  onNotify,
}: ReportsSectionProps) {
  const categoryNameMap = Object.fromEntries(
    categories.map((c) => [c.slug, c.name])
  );
  function getCategoryLabel(slug: string): string {
    return categoryNameMap[slug] || CATEGORY_LABELS[slug] || slug;
  }
  const [report, setReport] = useState<SalesReport>(initialReport);
  const [dateFrom, setDateFrom] = useState(initialReport.dateFrom);
  const [dateTo, setDateTo] = useState(initialReport.dateTo);
  const [loading, setLoading] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/api/reports?dateFrom=${encodeURIComponent(
        initialReport.dateFrom
      )}&dateTo=${encodeURIComponent(initialReport.dateTo)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.report) setReport(d.report);
      })
      .catch(() => {});
  }, [initialReport.dateFrom, initialReport.dateTo]);

  async function fetchReport(from: string, to: string) {
    if (from && to && to < from) {
      onNotify?.(
        "error",
        "Tanggal akhir tidak boleh lebih awal dari tanggal mulai"
      );
      return;
    }
    setLoading(true);
    setDateFrom(from);
    setDateTo(to);
    try {
      const res = await fetch(
        `/api/reports?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`
      );
      if (!res.ok) {
        onNotify?.("error", "Gagal memuat laporan penjualan");
        return;
      }
      const data = await res.json();
      setReport(data.report);
    } catch {
      onNotify?.("error", "Koneksi gagal saat memuat laporan");
    } finally {
      setLoading(false);
    }
  }

  const today = getTodayWIB();
  const isInvalidDateRange = Boolean(dateFrom && dateTo && dateTo < dateFrom);
  const stockMenus = report.menuSales.filter((m) => m.trackStock);
  const maxDailyRevenue = Math.max(
    1,
    ...report.dailyBreakdown.map((d) => d.revenue)
  );
  const avgDailyRevenue =
    report.dailyBreakdown.length > 0
      ? Math.round(
          report.dailyBreakdown.reduce((sum, d) => sum + d.revenue, 0) /
            report.dailyBreakdown.length
        )
      : 0;
  const peakDay =
    report.dailyBreakdown.length > 0
      ? report.dailyBreakdown.reduce((best, cur) =>
          cur.revenue > best.revenue ? cur : best
        )
      : null;
  const activeDay =
    report.dailyBreakdown.find((d) => d.date === selectedDayDate) ??
    peakDay ??
    report.dailyBreakdown[report.dailyBreakdown.length - 1] ??
    null;
  const periodLabel =
    report.dateFrom === report.dateTo
      ? formatDateShortID(report.dateFrom)
      : `${formatDateShortID(report.dateFrom)} – ${formatDateShortID(report.dateTo)}`;

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchReport(today, today)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                dateFrom === today && dateTo === today
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => fetchReport(getDaysAgoWIB(6), today)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                dateFrom === getDaysAgoWIB(6) && dateTo === today
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => fetchReport(getDaysAgoWIB(29), today)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                dateFrom === getDaysAgoWIB(29) && dateTo === today
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              }`}
            >
              30 Hari Terakhir
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 hidden sm:block" aria-hidden="true" />
            <label htmlFor="report-date-from" className="sr-only">
              Tanggal mulai
            </label>
            <input
              id="report-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
            />
            <span className="text-xs font-medium text-slate-600">s/d</span>
            <label htmlFor="report-date-to" className="sr-only">
              Tanggal selesai
            </label>
            <input
              id="report-date-to"
              type="date"
              min={dateFrom}
              aria-invalid={isInvalidDateRange}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`min-h-[38px] rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 ${
                isInvalidDateRange ? "border-red-600 text-red-900" : "border-slate-300"
              }`}
            />
            <button
              type="button"
              disabled={loading || isInvalidDateRange}
              onClick={() => fetchReport(dateFrom, dateTo)}
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
              <span>Terapkan</span>
            </button>
          </div>
        </div>

        {isInvalidDateRange && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-800"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-700" aria-hidden="true" />
            <span>
              Tanggal akhir tidak boleh lebih awal dari tanggal mulai.
            </span>
          </div>
        )}
      </div>

      {/* KPI Strip — Clean Square-style flat bordered summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-600">Total Omzet</div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-2 tabular-nums">
            {formatRupiah(report.totalRevenue)}
          </div>
          <div className="text-xs text-slate-600 mt-1.5">{periodLabel}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-600">
            Total Pesanan
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-2 tabular-nums">
            {report.totalOrders} selesai
          </div>
          <div className="text-xs text-slate-600 mt-1.5">
            {report.cancelledOrders > 0 ? (
              <span className="text-red-700 font-semibold">
                {report.cancelledOrders} dibatalkan
              </span>
            ) : (
              "Tidak ada pembatalan"
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-600">
            Tunai vs QRIS
          </div>
          <div className="mt-2.5 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                <Banknote className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                Tunai ({report.cashOrders})
              </span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatRupiah(report.cashRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                <QrCode className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                QRIS ({report.qrisOrders})
              </span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatRupiah(report.qrisRevenue)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-600">
            Sisa Stok Menu
          </div>
          <div className="mt-2.5 space-y-2">
            {stockMenus.length === 0 ? (
              <div className="text-xs text-slate-600">
                Belum ada menu dengan lacak stok
              </div>
            ) : (
              stockMenus.map((m) => (
                <div
                  key={m.menuId}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-slate-800 text-xs font-semibold truncate">
                    {m.menuName}
                  </span>
                  <span
                    className={`inline-flex items-center font-mono font-bold tabular-nums text-xs px-2 py-0.5 rounded-md whitespace-nowrap ${
                      m.currentStock === 0
                        ? "bg-red-100 text-red-800"
                        : m.currentStock <= 5
                        ? "bg-amber-100 text-amber-900"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {m.currentStock} ptg
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Menu Sales Breakdown — Responsive Cards (Mobile) + Table (Desktop) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900 text-base">
            Rekap Terjual per Menu
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Rekap jumlah terjual dan sisa stok tiap menu pada periode {periodLabel}.
          </p>
        </div>

        {/* Mobile Card List (< md) — Zero horizontal clipping */}
        <div className="md:hidden divide-y divide-slate-200">
          {report.menuSales.map((item) => (
            <div key={item.menuId} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900">
                    {item.menuName}
                  </div>
                  <span className="inline-flex items-center mt-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                    {getCategoryLabel(item.category)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-sm text-blue-700 tabular-nums">
                    {formatRupiah(item.totalRevenue)}
                  </div>
                  <div className="text-xs font-mono text-slate-700 tabular-nums mt-0.5">
                    Terjual: <strong>{item.quantitySold}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                <span className="text-slate-600">Sisa Stok</span>
                {item.trackStock ? (
                  <span
                    className={`inline-flex items-center font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                      item.currentStock === 0
                        ? "bg-red-100 text-red-800"
                        : item.currentStock <= 5
                        ? "bg-amber-100 text-amber-900"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {item.currentStock} ptg
                  </span>
                ) : (
                  <span className="text-slate-600">Hitung terjual saja</span>
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
                <th className="px-5 py-3">Menu</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3 text-right">Terjual</th>
                <th className="px-5 py-3 text-right">Sisa Stok</th>
                <th className="px-5 py-3 text-right">Total Penjualan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.menuSales.map((item) => (
                <tr key={item.menuId} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {item.menuName}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                      {getCategoryLabel(item.category)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {item.quantitySold}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {item.trackStock ? (
                      <span
                        className={`inline-flex items-center text-xs font-mono font-bold px-2.5 py-0.5 rounded-md whitespace-nowrap ${
                          item.currentStock === 0
                            ? "bg-red-100 text-red-800"
                            : item.currentStock <= 5
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {item.currentStock} ptg
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">
                        Hitung terjual saja
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-700 tabular-nums">
                    {formatRupiah(item.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Day Daily Breakdown — Horizontal Column Bar Chart */}
      {report.dailyBreakdown.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                Tren Omzet Harian ({report.dailyBreakdown.length} Hari)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Arahkan kursor atau ketuk batang grafik untuk melihat detail omzet per tanggal.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold tabular-nums">
                Rata-rata/hari:{" "}
                <strong className="font-mono text-slate-900">
                  {formatRupiah(avgDailyRevenue)}
                </strong>
              </span>
              {peakDay && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-semibold tabular-nums">
                  Tertinggi:{" "}
                  <strong className="font-mono">
                    {formatRupiah(peakDay.revenue)}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Selected / Hovered Day Readout Strip */}
            {activeDay && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-700 shrink-0" />
                  <span className="font-bold text-slate-900">
                    {formatDateShortID(activeDay.date)}
                  </span>
                  {peakDay?.date === activeDay.date && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold text-[11px]">
                      Tertinggi
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 tabular-nums">
                  <span className="text-slate-600 font-medium">
                    {activeDay.orders} transaksi
                  </span>
                  <span className="font-mono font-bold text-sm text-blue-700">
                    {formatRupiah(activeDay.revenue)}
                  </span>
                </div>
              </div>
            )}

            {/* Horizontal Chart Area with Y-axis Gridlines */}
            <div className="flex gap-3">
              {/* Y-Axis Labels */}
              <div className="hidden sm:flex flex-col justify-between h-52 pb-6 text-[11px] font-mono text-slate-600 text-right shrink-0 w-16 tabular-nums select-none">
                <span>{formatCompactRupiah(maxDailyRevenue)}</span>
                <span>{formatCompactRupiah(Math.round(maxDailyRevenue / 2))}</span>
                <span>Rp 0</span>
              </div>

              {/* Scrollable Horizontal Columns */}
              <div className="flex-1 min-w-0 overflow-x-auto pb-1">
                <div
                  className="relative"
                  style={{
                    minWidth:
                      report.dailyBreakdown.length > 10
                        ? `${report.dailyBreakdown.length * 32}px`
                        : "100%",
                  }}
                >
                  {/* Subtle Horizontal Gridlines */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
                  >
                    <div className="border-t border-dashed border-slate-200 w-full" />
                    <div className="border-t border-dashed border-slate-200 w-full" />
                    <div className="border-t border-slate-300 w-full" />
                  </div>

                  {/* Vertical Bars Row */}
                  <div className="relative z-10 flex items-end gap-1.5 sm:gap-2 h-52 pt-1">
                    {report.dailyBreakdown.map((day, idx) => {
                      const heightPct = Math.max(
                        day.revenue > 0 ? 4 : 0,
                        Math.round((day.revenue / maxDailyRevenue) * 100)
                      );
                      const isActive = activeDay?.date === day.date;
                      const isPeak = peakDay?.date === day.date;
                      const showLabel =
                        report.dailyBreakdown.length <= 14 ||
                        idx % 2 === 0 ||
                        idx === report.dailyBreakdown.length - 1;

                      return (
                        <button
                          key={day.date}
                          type="button"
                          onMouseEnter={() => setSelectedDayDate(day.date)}
                          onFocus={() => setSelectedDayDate(day.date)}
                          onClick={() => setSelectedDayDate(day.date)}
                          aria-label={`${formatDateShortID(day.date)}: ${formatRupiah(
                            day.revenue
                          )} (${day.orders} transaksi)`}
                          className="group flex-1 min-w-[24px] h-full flex flex-col items-center justify-end gap-1.5 cursor-pointer focus-visible:outline-blue-700"
                        >
                          <div className="w-full flex-1 flex items-end justify-center px-0.5">
                            <div
                              className={`w-full max-w-[36px] rounded-t-md transition-all ${
                                isActive
                                  ? "bg-blue-700"
                                  : isPeak
                                  ? "bg-blue-600 group-hover:bg-blue-700"
                                  : "bg-blue-500/75 group-hover:bg-blue-700"
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span
                            className={`h-4 text-[10px] font-mono tabular-nums whitespace-nowrap ${
                              isActive
                                ? "font-bold text-blue-700"
                                : "text-slate-600"
                            }`}
                          >
                            {showLabel ? formatDayTick(day.date) : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
