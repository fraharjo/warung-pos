"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Printer, X, CheckCircle2, Ban, Banknote, QrCode } from "lucide-react";
import { formatDateTimeWIB, formatRupiah } from "@/lib/format";
import type { Order, StoreSettings } from "@/lib/types";

type PaperWidth = 58 | 80;
const PAPER_WIDTH_STORAGE_KEY = "pos_receipt_paper_width";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function printThermalReceipt(
  order: Order,
  settings: StoreSettings,
  paperWidth: PaperWidth
) {
  const fontSizePx = paperWidth === 58 ? 11 : 12;
  const padX = paperWidth === 58 ? "2.5mm" : "4mm";
  const padY = paperWidth === 58 ? "3mm" : "4mm";

  const itemsHtml = order.items
    .map(
      (item) => `
      <div class="item">
        <div class="item-name">${escapeHtml(item.menuName)}</div>
        <div class="row sub">
          <span>${item.quantity} x ${escapeHtml(formatRupiah(item.price))}</span>
          <span class="bold">${escapeHtml(formatRupiah(item.subtotal))}</span>
        </div>
      </div>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Struk ${escapeHtml(order.orderNumber)}</title>
<style id="page-size-style">
  @page { size: ${paperWidth}mm 160mm; margin: 0; }
</style>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: ${paperWidth}mm;
    background: #ffffff;
    color: #000000;
    font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: ${fontSizePx}px;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .receipt {
    width: ${paperWidth}mm;
    padding: ${padY} ${padX};
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .store-name {
    font-size: ${paperWidth === 58 ? 13 : 15}px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .muted { font-size: ${paperWidth === 58 ? 10 : 11}px; }
  .divider {
    border-top: 1px dashed #000000;
    margin: 6px 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 6px;
    font-variant-numeric: tabular-nums;
  }
  .row > span:last-child {
    text-align: right;
    white-space: nowrap;
  }
  .meta { display: flex; flex-direction: column; gap: 2px; font-size: ${paperWidth === 58 ? 10 : 11}px; }
  .item { margin-bottom: 5px; }
  .item:last-child { margin-bottom: 0; }
  .item-name { font-weight: 600; word-break: break-word; overflow-wrap: anywhere; }
  .sub { font-size: ${paperWidth === 58 ? 10 : 11}px; }
  .total-row { font-size: ${paperWidth === 58 ? 12 : 13}px; font-weight: 700; margin-bottom: 2px; }
  .cancelled {
    margin-top: 4px;
    padding: 2px 4px;
    border: 1px solid #000000;
    text-align: center;
    font-weight: 700;
  }
  .notes { font-size: ${paperWidth === 58 ? 10 : 11}px; word-break: break-word; }
  .footer { margin-top: 6px; text-align: center; font-size: ${paperWidth === 58 ? 10 : 11}px; }
</style>
</head>
<body>
  <div class="receipt" id="thermal-root">
    <div class="center">
      <div class="store-name">${escapeHtml(settings.storeName)}</div>
      ${settings.storeAddress ? `<div class="muted">${escapeHtml(settings.storeAddress)}</div>` : ""}
      ${settings.storePhone ? `<div class="muted">Telp: ${escapeHtml(settings.storePhone)}</div>` : ""}
    </div>

    <div class="divider"></div>

    <div class="meta">
      <div class="row"><span>No Order</span><span class="bold">${escapeHtml(order.orderNumber)}</span></div>
      <div class="row"><span>Waktu</span><span>${escapeHtml(formatDateTimeWIB(order.createdAt))}</span></div>
      <div class="row"><span>Kasir</span><span>${escapeHtml(order.cashierName)}</span></div>
      <div class="row"><span>Pelanggan</span><span class="bold">${escapeHtml(order.customerName)}</span></div>
      ${order.status === "cancelled" ? `<div class="cancelled">*** DIBATALKAN ***</div>` : ""}
    </div>

    <div class="divider"></div>

    <div>${itemsHtml}</div>

    <div class="divider"></div>

    <div class="meta">
      <div class="row total-row"><span>TOTAL</span><span>${escapeHtml(formatRupiah(order.totalAmount))}</span></div>
      <div class="row"><span>Bayar (${order.paymentMethod === "cash" ? "Tunai" : "QRIS"})</span><span>${escapeHtml(formatRupiah(order.amountPaid))}</span></div>
      ${
        order.paymentMethod === "cash"
          ? `<div class="row bold"><span>Kembali</span><span>${escapeHtml(formatRupiah(order.changeAmount))}</span></div>`
          : ""
      }
    </div>

    ${
      order.notes
        ? `<div class="divider"></div><div class="notes">Catatan: ${escapeHtml(order.notes)}</div>`
        : ""
    }

    <div class="divider"></div>
    <div class="footer">${escapeHtml(settings.receiptFooter || "Terima kasih!")}</div>
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = `${paperWidth}mm`;
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  win.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 60_000);

  requestAnimationFrame(() => {
    const root = doc.getElementById("thermal-root");
    if (root) {
      const heightPx = root.getBoundingClientRect().height;
      const heightMm = Math.max(60, Math.ceil((heightPx * 25.4) / 96) + 8);
      const pageStyle = doc.getElementById("page-size-style");
      if (pageStyle) {
        pageStyle.textContent = `@page { size: ${paperWidth}mm ${heightMm}mm; margin: 0; }`;
      }
    }
    requestAnimationFrame(() => {
      win.focus();
      win.print();
    });
  });
}

interface ReceiptModalProps {
  order: Order | null;
  settings: StoreSettings;
  isNewOrder?: boolean;
  onClose: () => void;
}

export function ReceiptModal({
  order,
  settings,
  isNewOrder = false,
  onClose,
}: ReceiptModalProps) {
  const titleId = useId();
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(() => {
    if (typeof window === "undefined") return 58;
    const saved = window.localStorage.getItem(PAPER_WIDTH_STORAGE_KEY);
    return saved === "80" ? 80 : 58;
  });

  function handlePaperWidthChange(width: PaperWidth) {
    setPaperWidth(width);
    try {
      window.localStorage.setItem(PAPER_WIDTH_STORAGE_KEY, String(width));
    } catch {
      // ignore storage errors
    }
  }

  const handlePrint = useCallback(() => {
    if (!order) return;
    printThermalReceipt(order, settings, paperWidth);
  }, [order, settings, paperWidth]);

  useEffect(() => {
    if (!order) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isNewOrder) {
        onClose();
      } else if (
        (e.key === "p" || e.key === "P") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          handlePrint();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [order, isNewOrder, onClose, handlePrint]);

  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 overflow-y-auto"
      onClick={() => {
        if (!isNewOrder) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (non-printed) */}
        <div
          className={`shrink-0 flex items-center justify-between px-5 py-3.5 border-b ${
            order.status === "cancelled"
              ? "bg-red-50 border-red-200"
              : isNewOrder
              ? "bg-emerald-50 border-emerald-200"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {order.status === "cancelled" ? (
              <>
                <Ban className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
                <h2 id={titleId} className="font-bold text-sm text-red-900 truncate">
                  Pesanan Dibatalkan
                </h2>
              </>
            ) : isNewOrder ? (
              <>
                <CheckCircle2
                  className="w-5 h-5 text-emerald-700 shrink-0"
                  aria-hidden="true"
                />
                <h2
                  id={titleId}
                  className="font-bold text-sm text-emerald-900 truncate"
                >
                  Pembayaran Berhasil — {order.orderNumber}
                </h2>
              </>
            ) : (
              <h2 id={titleId} className="font-bold text-sm text-slate-900 truncate">
                Struk Pesanan — {order.orderNumber}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer shrink-0"
            aria-label="Tutup struk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* High-Visibility Hero Change / Payment Banner for New Orders */}
        {isNewOrder && order.status === "completed" && (
          <div className="shrink-0 px-5 pt-4 pb-2 bg-white">
            {order.paymentMethod === "cash" ? (
              <div className="receipt-hero-settle rounded-xl bg-slate-900 text-white p-4">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Banknote className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    Kembalian Tunai
                  </span>
                  <span className="font-mono tabular-nums">
                    Bayar {formatRupiah(order.amountPaid)}
                  </span>
                </div>
                <div className="mt-1.5 text-3xl font-extrabold font-mono tracking-tight tabular-nums text-emerald-400">
                  {formatRupiah(order.changeAmount)}
                </div>
                <div className="mt-1 text-xs text-slate-300 font-mono tabular-nums">
                  Total belanja {formatRupiah(order.totalAmount)}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <QrCode className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    Lunas via QRIS
                  </div>
                  <div className="mt-1 text-2xl font-extrabold font-mono tabular-nums text-white">
                    {formatRupiah(order.totalAmount)}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-700 text-white text-xs font-bold whitespace-nowrap">
                  TERBAYAR
                </span>
              </div>
            )}
          </div>
        )}

        {/* Printable Thermal Receipt Preview */}
        <div className="flex-1 min-h-0 p-4 sm:p-5 bg-slate-50 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-600">
              Ukuran Kertas Termal
            </span>
            <div
              role="group"
              aria-label="Pilih ukuran kertas termal"
              className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5"
            >
              {([58, 80] as PaperWidth[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handlePaperWidthChange(w)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    paperWidth === w
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {w}mm
                </button>
              ))}
            </div>
          </div>

          <div
            id="receipt-printable"
            className={`mx-auto bg-white border border-dashed border-slate-300 rounded-lg p-4 font-mono text-xs text-slate-900 transition-all ${
              paperWidth === 58 ? "max-w-[270px]" : "max-w-[350px]"
            }`}
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="font-bold text-sm uppercase tracking-wide text-slate-900">
                {settings.storeName}
              </div>
              {settings.storeAddress && (
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {settings.storeAddress}
                </div>
              )}
              {settings.storePhone && (
                <div className="text-[11px] text-slate-600">
                  Telp: {settings.storePhone}
                </div>
              )}
            </div>

            {/* Order Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">No Order</span>
                <span className="font-semibold text-slate-900">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Waktu</span>
                <span>{formatDateTimeWIB(order.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Kasir</span>
                <span>{order.cashierName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Pelanggan</span>
                <span className="font-semibold text-slate-900">
                  {order.customerName}
                </span>
              </div>
              {order.status === "cancelled" && (
                <div className="text-center font-bold text-red-700 border border-red-400 rounded py-0.5 mt-1">
                  *** DIBATALKAN ***
                </div>
              )}
            </div>

            {/* Items */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
              {order.items.map((item) => (
                <div key={item.id}>
                  <div className="font-semibold text-slate-900">
                    {item.menuName}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 tabular-nums">
                    <span>
                      {item.quantity} x {formatRupiah(item.price)}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px] tabular-nums">
              <div className="flex justify-between text-xs font-bold text-slate-900">
                <span>TOTAL</span>
                <span>{formatRupiah(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Bayar ({order.paymentMethod === "cash" ? "Tunai" : "QRIS"})
                </span>
                <span>{formatRupiah(order.amountPaid)}</span>
              </div>
              {order.paymentMethod === "cash" && (
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Kembali</span>
                  <span>{formatRupiah(order.changeAmount)}</span>
                </div>
              )}
            </div>

            {order.notes && (
              <div className="py-2 border-b border-dashed border-slate-300 text-[11px]">
                <span className="text-slate-600">Catatan: </span>
                <span className="text-slate-900">{order.notes}</span>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 text-center text-[11px] text-slate-600">
              {settings.receiptFooter || "Terima kasih!"}
            </div>
          </div>
        </div>

        {/* Action Buttons — minimum 44px touch targets */}
        <div className="shrink-0 p-4 bg-white border-t border-slate-200 flex gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-2.5 px-4 text-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Cetak Struk (P)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-2.5 px-5 text-sm transition cursor-pointer whitespace-nowrap"
          >
            {isNewOrder ? "Order Baru" : "Tutup"}
          </button>
        </div>
      </div>
    </div>
  );
}
