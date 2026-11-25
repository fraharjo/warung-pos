# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Kasir Warung (Primary — `/pos`)**: Operates the counter register on a tablet or counter laptop during busy meal rushes (often with damp hands, handling cash bills and QRIS scans, calling orders to the grill, and printing 58mm thermal receipts). Job: ring up multi-item orders fast, capture dine-in/takeaway and sambal/grill notes with minimal typing, calculate exact change, and verify remaining chicken stock without errors.
- **Pemilik / Admin Warung (Primary — `/admin`)**: Manages the shop mostly from a smartphone (`390px`) while away or between shifts, and occasionally on laptop. Job: check daily/range revenue (Tunai vs QRIS), track and restock chicken cuts by whole bird, cancel erroneous orders with stock restoration, manage menu prices/availability, and update store/receipt settings and staff accounts.

## Product Purpose

**Kasir Ayam Bakar (Ayam Bakar Spesial)** is a lightweight Point-of-Sale, order history, and chicken-inventory web app built specifically for an Indonesian grilled chicken stall (*warung ayam bakar*). Success means zero-hesitation rush-hour checkout on tablet/laptop, zero stock miscounts on Paha/Dada cuts, clear 58mm thermal receipts with unmistakable cash change, and effortless one-handed monitoring and management from the owner's phone.

## Positioning

Unlike generic SaaS POS systems, this app is centered on Indonesian *warung ayam bakar* operations: whole-bird butcher restocking (`1 Ekor Ayam = 2 Paha + 2 Dada`), selective stock tracking (counting physical cuts for chicken while only tallying sales volume for rice and drinks), rapid warung order flows (`Makan Sini / Bungkus`, quick sambal/grill modifiers), and direct 58mm thermal receipt printing — runnable locally with zero database setup or deployed free on Vercel + Neon PostgreSQL.

## Operating Context

- **Counter Register**: Bright/glare-prone street-side warung environment on tablet (`768px`) or counter laptop (`1366×768`+), handling rapid walk-up orders, cash bills (`Rp 20.000`–`Rp 100.000`), QRIS payments, and 58mm thermal receipt printers (`@media print`).
- **Owner Mobile Management**: Checked on-the-go on a `390px` smartphone (at the morning market buying whole chickens, or evening wrap-up checking cash vs QRIS totals).
- **Roles & Access**: Role-based authentication (`kasir` → `/pos`, `admin` → `/admin` + `/pos`); only Admin may cancel orders, manage stock, edit menus/prices, view full reports, and manage accounts/settings.

## Capabilities and Constraints

- **Confirmed Core Capabilities**:
  - Role-based login (`/login`) for Kasir and Admin.
  - Fast POS register (`/pos`) with menu categories, live chicken stock deduction, Tunai/QRIS payment with live change calculation, 58mm thermal receipt printing, today's transaction history, plus fast warung ordering workflows (Makan Sini / Bungkus, quick sambal/note chips, keyboard shortcuts).
  - Admin back-office (`/admin`): Sales Reports (date presets, Tunai vs QRIS, per-menu sales breakdown), Chicken Stock Management with **Restock Cepat per Ekor (`1 ekor = 2 paha + 2 dada`)** & manual adjustment/spoilage logs, Order History & Admin-only cancellation with automatic chicken stock restoration, Menu & Price management, and User Accounts & Store/Receipt settings.
- **Technical Constraints**:
  - Next.js App Router + React 19 + Tailwind CSS v4 + `lucide-react`.
  - Dual storage adapter (`.local-data/db.json` locally and Neon PostgreSQL via `DATABASE_URL`) — preserve existing API contracts and data compatibility without breaking migrations.
  - Preserve `@media print` 58mm thermal receipt output (`#receipt-printable`).
- **Explicitly Preserved Constraints**:
  - Must retain **Restock Cepat per Ekor (`1 ekor = 2 paha + 2 dada`)** and live chicken stock tracking.
  - Indonesian (`id`) language UI and `Rp` Rupiah currency formatting (`tabular-nums`).

## Brand Commitments

- **POS Modern Standar (Category Canon)**: Standing preference for a clean, minimalist, high-contrast modern POS aesthetic executed straight without gimmickry, benchmarked to **Square POS** craft level (wide touch targets, instant scanability, crisp neutral surfaces, unmistakable primary actions, fast counter speed).

## Evidence on Hand

- Live Next.js codebase (`src/app/**`, `src/components/**`, `src/lib/**`) with seeded menus (`Ayam Bakar (Paha)`, `Ayam Bakar (Dada)`, `Nasi Putih`, `Nasi Uduk`, `Es Teh Manis`, `Teh Tawar`) and dual-agent critique baseline (`20/40`, `.impeccable/critique/2026-11-24T12-34-44Z__src-components-posclient-tsx.md`).
- No custom brand logo file or menu photography assets exist in `public/`; do not fabricate store claims, customer counts, or fake testimonials.

## Product Principles

1. **Counter Speed First**: Optimize `/pos` for zero-hesitation tapping and keyboard speed during dinner rush—large touch targets, instant Paha/Dada recognition, and pinned payment actions above the fold.
2. **Whole-Bird Stock Truth**: Keep chicken inventory single-sourced, unmistakable, and protected against accidental restock or wipe errors.
3. **Owner Mobile Parity**: Treat `390px` mobile as a first-class surface for `/admin`, never hiding core edits or status toggles behind horizontal table overflow.
4. **Honest Operational Contrast**: High-contrast numerals, readable states, and unmistakable cash change (`Kembalian`) built for glare-prone counters and budget screens.
5. **Preserve What Works**: Keep thermal 58mm printing, Tunai/QRIS flows, and whole-bird restock math rock-solid while eliminating generic SaaS clutter.

## Accessibility & Inclusion

- Meet WCAG AA (`>= 4.5:1`) contrast across all primary buttons, secondary labels, placeholders, and disabled states (designed for bright warung glare and lower-contrast tablets).
- Minimum `40–44px` touch targets on frequent POS controls, proper `htmlFor`/`id` labels, `aria-label` on icon-only controls, `role="dialog"` + `Escape` on modals, `aria-live` on status/error toasts, and visible `focus-visible` keyboard rings.
