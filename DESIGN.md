---
name: Ayam Bakar Spesial POS
description: High-contrast counter register and mobile-first owner dashboard built for rush-hour warung speed and whole-bird stock accuracy.
colors:
  cobalt-primary: "#1d4ed8"
  cobalt-hover: "#1e40af"
  cobalt-active: "#1e3a8a"
  cobalt-dark-action: "#2563eb"
  cobalt-tint: "#eff6ff"
  slate-alabaster: "#f8fafc"
  surface-white: "#ffffff"
  surface-subtle: "#f1f5f9"
  deep-ink: "#0f172a"
  slate-body: "#334155"
  slate-muted: "#475569"
  slate-placeholder: "#64748b"
  border-hairline: "#e2e8f0"
  border-control: "#cbd5e1"
  emerald-healthy: "#047857"
  emerald-ink: "#064e3b"
  emerald-bar: "#059669"
  emerald-hero: "#34d399"
  emerald-tint: "#ecfdf5"
  emerald-badge: "#d1fae5"
  amber-warning: "#92400e"
  amber-ink: "#78350f"
  amber-bar: "#d97706"
  amber-tint: "#fffbeb"
  amber-badge: "#fef3c7"
  amber-border: "#fcd34d"
  red-danger: "#b91c1c"
  red-hover: "#991b1b"
  red-ink: "#7f1d1d"
  red-bar: "#dc2626"
  red-tint: "#fef2f2"
  red-badge: "#fee2e2"
  red-border: "#fecaca"
  paha-badge: "#dbeafe"
  paha-ink: "#1e3a8a"
  paha-border: "#bfdbfe"
  drink-badge: "#e0f2fe"
  drink-ink: "#0c4a6e"
  drink-border: "#bae6fd"
typography:
  display:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
    fontFeature: '"tnum" 1'
  headline:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontFeature: '"tnum" 1'
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt-primary}"
    textColor: "{colors.surface-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-hover}"
    textColor: "{colors.surface-white}"
  button-primary-disabled:
    backgroundColor: "{colors.border-hairline}"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
  button-dark:
    backgroundColor: "{colors.deep-ink}"
    textColor: "{colors.surface-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.red-danger}"
    textColor: "{colors.surface-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  input-default:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  card-surface:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  menu-pad:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
    height: "176px"
  menu-pad-selected:
    backgroundColor: "{colors.cobalt-tint}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
    height: "176px"
  chip-default:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.slate-body}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
    height: "36px"
  chip-active:
    backgroundColor: "{colors.cobalt-primary}"
    textColor: "{colors.surface-white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
    height: "36px"
  tag-paha:
    backgroundColor: "{colors.paha-badge}"
    textColor: "{colors.paha-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  tag-dada:
    backgroundColor: "{colors.amber-badge}"
    textColor: "{colors.amber-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  total-bar:
    backgroundColor: "{colors.deep-ink}"
    textColor: "{colors.surface-white}"
    typography: "{typography.headline}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  nav-tab-active:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.cobalt-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "6px 14px"
---

# Design System: Ayam Bakar Spesial POS

## Overview

**Creative North Star: "The Square-Grade Counter Register"**

Ayam Bakar Spesial POS is an operational point-of-sale and chicken-inventory system designed for bright, glare-prone Indonesian street-side *warung* counters and one-handed owner monitoring on `390px` smartphones. Rather than warm restaurant ornament or decorative SaaS cards, the interface speaks with crisp neutral precision: cool slate-alabaster ground, pure white bordered work surfaces, deep slate ink anchors for financial totals, and disciplined cobalt blue reserved strictly for primary actions and active selection.

Every visual choice serves rush-hour legibility and mistake prevention. Cashiers distinguish `PAHA` and `DADA` cuts at a glance, watch single-source grill stock decrement live as items enter the cart, trigger `Makan Sini / Bungkus` and sambal notes in one tap, and read exact cash change (`Kembalian Tunai`) off a dark-ink hero banner that settles with a crisp exponential ease-out (`240ms cubic-bezier(0.16, 1, 0.3, 1)`) directly above a `58mm` thermal receipt preview. Owners on mobile never fight horizontal table overflow: every admin dataset collapses cleanly into full-field stacked cards below `768px`.

This system deliberately rejects decorative drop shadows on resting cards, double-device elevation (pairing shadows with outer borders on floating layers), cream-and-orange restaurant clichés, low-contrast disabled buttons, and unconfirmed bulk stock actions.

**Key Characteristics:**
- **Glare-proof neutral contrast**: Cool slate-alabaster canvas with pure white cards, `1px` crisp hairlines, and WCAG AA (`>= 4.5:1`) text contrast across active, muted, placeholder, and disabled states.
- **Disciplined cobalt action voice**: High-contrast cobalt (`6.7:1` on white) signals primary CTAs, active category/cart selection, unified focus rings, and text selection—never decorative fills.
- **Instant cut and stock semantics**: Distinct color-coded cut tags (`PAHA` blue vs `DADA` amber) and three-tier stock health (`Aman` emerald, `Menipis` amber, `Habis` red) synchronized live across header, menu pads, and admin dashboards.
- **Self-hosted offline-safe typography**: Local `Inter` (variable `100 900`) and `IBM Plex Mono` (`400`/`600`/`700`) via `@font-face` in `public/fonts/`, ensuring every Rupiah amount, order number, timestamp, and piece count locks to `tabular-nums` even without external font CDNs.
- **Single-device elevation & dual-surface discipline**: Resting surfaces use borders only, floating modals/toasts use shadows only, desktop `/pos` locks to `100vh` (`lg:h-screen`), mobile `/admin` guarantees `390px` card parity, and `@media print` isolates `58mm` thermal output.

## Colors

A crisp slate-neutral foundation paired with one high-contrast cobalt primary accent, deep-ink financial anchors, and strict semantic status and chicken-cut coding.

### Primary
- **Cobalt Primary** (`#1d4ed8`, CSS `--accent`): Primary submit actions (`Bayar & Simpan Pesanan`, `Cetak Struk`, `Masuk`, `Buka Kasir`, `Tambah Menu`), active category tabs, selected menu pad borders (`2px`) and quantity badges, active modifier chips, `focus-visible` outlines, text selection, and input carets. Achieves `6.7:1` contrast with white text.
- **Cobalt Hover & Active** (`#1e40af` `--accent-hover`, `#1e3a8a` active): Pressed and hover feedback on primary buttons.
- **Cobalt Dark-Surface Action** (`#2563eb`, hover `#3b82f6`): Elevated-luminance cobalt used exclusively for the submit CTA inside the dark `#0f172a` whole-chicken restock banner so button separation stays unmistakable on dark ink.
- **Cobalt Tint** (`#eff6ff`): Soft selection wash for active Tunai/QRIS payment toggles and selected POS menu touch pads (at 60% opacity over white).

### Secondary
Semantic operational colors are strictly functional—never applied as general decoration.
- **Healthy / Change / Restock Emerald** (`#047857` action/delta, `#064e3b` badge ink, `#059669` capacity bar, `#34d399` hero change on dark ink, `#ecfdf5` / `#d1fae5` tints): Healthy chicken stock (`> 5 ptg`), positive cash change readouts, completed order badges, `NASI` category tags, and manual restock actions.
- **Warning / Low Stock / Dada Amber** (`#92400e` text, `#78350f` badge ink, `#d97706` bar, `#fffbeb` / `#fef3c7` tints, `#fcd34d` border): Low chicken stock (`1–5 ptg`), cancelled-stock-return log badges, and `DADA` chicken cut pills so cashiers never confuse `DADA` with `PAHA`.
- **Danger / Out of Stock / Cancel Red** (`#b91c1c` fill/ink, `#991b1b` hover/badge ink, `#7f1d1d` header title, `#dc2626` bar, `#fef2f2` / `#fee2e2` tints, `#fecaca` border): Zero-stock indicators (`HABIS`), cash shortage readouts (`Uang Kurang`), cancelled orders, destructive modal headers/confirmations, and error toasts.
- **Category Cut Coding**:
  - `PAHA` / `AYAM` pill: Soft blue badge (`#dbeafe`), deep blue ink (`#1e3a8a`), light blue border (`#bfdbfe`).
  - `DADA` pill: Warm amber badge (`#fef3c7`), deep amber ink (`#78350f`), amber border (`#fcd34d`).
  - `NASI` pill: Emerald badge (`#d1fae5`), deep emerald ink (`#064e3b`), emerald border (`#a7f3d0`).
  - `MINUMAN` pill: Sky badge (`#e0f2fe`), deep sky ink (`#0c4a6e`), sky border (`#bae6fd`).
  - `LAINNYA` pill: Neutral slate badge (`#e2e8f0`), slate ink (`#1e293b`), control border (`#cbd5e1`).

### Neutral
- **Cool Slate-Alabaster** (`#f8fafc`, `--background`): Global page ground beneath all white workspace surfaces.
- **Pure White** (`#ffffff`, `--surface`): Cards, sticky header, right-hand cart dock, menu touch pads, modals, and form inputs.
- **Subtle Slate Surface** (`#f1f5f9`, `--surface-subtle`): Recessed segmented tab tracks, table header rows, inactive mobile tabs, quick-cash buttons, and disabled/out-of-stock card surfaces.
- **Deep Ink** (`#0f172a`, `--foreground`): Primary headings, totals, dark checkout Total bar, hero `Kembalian Tunai` card, whole-chicken restock banner, brand icon tile, active admin navigation tabs, and neutral success toasts.
- **Body & Muted Ink** (`#334155` body secondary, `#475569` `--foreground-muted`, `#64748b` input placeholders): Secondary labels, timestamps, cashier names, helper copy, and disabled button ink (`#475569` on `#e2e8f0` = `5.7:1`, `#475569` on `#f1f5f9` = `6.8:1`).
- **Hairline & Control Borders** (`#e2e8f0` `--border`, `#cbd5e1` control stroke): `1px` container boundaries and dividers (`#e2e8f0`) vs crisper `1px` interactive input, secondary button, and mobile sticky-bar strokes (`#cbd5e1`).

### Named Rules
**The One Accent Voice Rule.** Cobalt (`#1d4ed8`) is reserved strictly for primary actions, active selection, and keyboard focus; dark ink (`#0f172a`) anchors structural headers, financial totals, and active admin tabs so the checkout CTA never competes with navigation chrome.

**The Cut-Contrast Rule.** `PAHA` (blue badge) and `DADA` (amber badge) must always carry distinct hue families so a cashier ringing up a dinner rush can confirm cut selection in peripheral vision without reading full menu names.

**The Readable-Disabled Rule.** Disabled buttons use `#475569` ink on `#e2e8f0` (`5.7:1`) or `#f1f5f9` (`6.8:1`) fill with explicit dynamic guidance text (e.g., `Pilih Menu Dulu`, `Masukkan Uang Tunai`, `Kurang Rp XX.XXX`) rather than faded grey opacity.

## Typography

**Display Font:** `IBM Plex Mono` (self-hosted `400`/`600`/`700` via `@font-face` in `public/fonts/ibm-plex-mono-*.woff2`, with `ui-monospace, SFMono-Regular, Menlo, monospace` fallback) — used for hero financial readouts and stock counts.
**Body Font:** `Inter` (self-hosted variable `100 900` via `@font-face` in `public/fonts/inter-*.woff2`, with `ui-sans-serif, system-ui, -apple-system, sans-serif` fallback) — used for all interface prose, menu titles, controls, and navigation.
**Label/Mono Font:** `IBM Plex Mono` (`--font-mono`, paired with `--font-sans: "Inter"`). Self-hosting eliminates external CDN latency and guarantees identical rendering on offline or local warung setups.

**Character:** Utilitarian, crisp, and optically engineered for glare-prone counter screens. `Inter` keeps Indonesian labels compact and scannable at small sizes, while `IBM Plex Mono` with `tabular-nums` locks every Rupiah column, subtotal, and stock badge into rigid vertical alignment.

### Hierarchy
- **Display** (`700` Bold / `800` ExtraBold utility synthesized to `700` face, `30px` / `1.875rem`, `line-height: 1.1`, `letter-spacing: -0.025em`, `IBM Plex Mono`, `tabular-nums`): Hero `Kembalian Tunai` readout in `ReceiptModal` and large remaining-piece counters in `StockSection`.
- **Headline** (`700` Bold, `24px` / `1.5rem`, `line-height: 1.25`, `letter-spacing: -0.025em`, `IBM Plex Mono`, `tabular-nums`): Checkout dock `Total Order`, QRIS paid banner amount, Admin KPI figures (`Total Omzet`, `Total Pesanan`), and Today History totals.
- **Title** (`700` Bold, `16px–20px` / `1rem–1.25rem`, `line-height: 1.35`, `Inter`): Login store heading (`20px`), section headings (`18px`), navbar store title, card/modal headers, and desktop menu pad titles (`16px`).
- **Body** (`500` Medium / `600` SemiBold, `14px` / `0.875rem`, `line-height: 1.45`, `Inter`): Buttons, form inputs, cart line item names, navigation tabs, order lists, table cells, and modal descriptions.
- **Label** (`600` SemiBold / `700` Bold, `11px–12px` / `0.6875rem–0.75rem`, `line-height: 1.33`, `Inter` or `IBM Plex Mono`): Form labels, metadata, timestamps, status pills, quick-cash chips, uppercase `11px` cut tags (`tracking-wide`), and `11px` (`line-height: 1.35`) `58mm` thermal receipt print lines.

### Named Rules
**The Tabular Money Rule.** Every Rupiah currency value, item quantity, stock piece count, order number, and WIB timestamp must set `font-mono` (`IBM Plex Mono`) and `tabular-nums` so numbers never jitter horizontally as quantities increment.

**The Plain-Indonesian Label Rule.** Interface copy uses concise, concrete Indonesian *warung* phrasing (`Makan Sini`, `Bungkus`, `Bayar & Simpan Pesanan`, `1 Ekor = 2 Paha + 2 Dada`) with direct sentence case—never decorative uppercase kickers or eyebrow captions above titles.

## Layout

The layout is governed by two primary operating postures—a viewport-locked counter register on desktop/tablet and a zero-clipping single-column card stack on `390px` mobile—plus a dedicated `58mm` thermal print stylesheet.

- **Spacing Rhythm**: Built on a `4px` base unit (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`). Standard page gutters are `16px` (`px-4`) on mobile and `24px` (`sm:px-6`) on tablet/desktop. Cards use `16px`–`20px` internal padding (`p-4` / `p-5`); login card uses `28px–32px` (`p-7 sm:p-8`).
- **POS Register (`/pos`)**:
  - **Sticky Header**: `64px` (`h-16`) white top bar (`max-w-[1600px]`, `shrink-0`), containing store identity, single-source live chicken stock pills (`xl:` `>= 1280px`, rendered exclusively on the `Kasir` tab to avoid duplicating the `Riwayat` stock card), segmented `Kasir` / `Riwayat` mode switcher (`md:` `>= 768px`), and utility actions (`Refresh`, `Admin` for admins, `Keluar`). Below `768px`, a `2`-button mobile tab bar docks under the header. Below `1280px`, live stock pills move into a compact horizontal strip above the menu grid.
  - **Viewport-Locked Desktop Split (`>= 1024px`, tuned for `1366×768` and `1440×900`)**: On the active `Kasir` tab, the outer shell locks to `lg:h-screen lg:overflow-hidden` and `<main>` uses `flex-1 lg:min-h-0 lg:overflow-hidden` (`max-w-[1600px]`). The left catalog column (`flex-1 lg:min-h-0 lg:overflow-y-auto`) houses category tabs, `/` quick search, and a `2`-column (`< 640px`) → `3`-column (`>= 640px`) menu touch pad grid (`12px` gap, `min-h-[148px]` on mobile, `lg:min-h-[176px]` on desktop). The right cart dock (`420px` at `lg`, `440px` at `xl`) pins the cart header, `Makan Sini / Bungkus` toggle, quick modifier chips, and the entire checkout block (Total + Tunai/QRIS + primary CTA) above the fold while only the cart line items scroll internally (`flex-1 lg:min-h-0 lg:overflow-y-auto`).
  - **Mobile/Tablet Register (`< 1024px`)**: Stacked vertical layout with an IntersectionObserver-driven sticky bottom bar (`border-t border-slate-300`, `Lanjut Bayar`) that appears whenever the cart is non-empty and `#cart-panel` is scrolled out of view.
- **Admin Dashboard (`/admin`)**:
  - Centered `max-w-7xl` (`1280px`) container with sticky header and horizontal scrollable 5-tab sub-navigation (`Laporan`, `Stok Ayam`, `Pesanan`, `Menu & Harga`, `Akun & Warung`) with a subtle right-edge white gradient fade on `< 640px` indicating horizontal scrollability.
  - **390px Mobile Card Parity (`< 768px`)**: All multi-column admin tables (`Rekap Terjual per Menu`, `Riwayat Pergerakan Stok`, `Daftar Menu & Harga`) render stacked full-detail mobile cards (`md:hidden`) below `768px` and switch to desktop tables (`hidden md:block`) at `>= 768px`, guaranteeing zero clipped columns or hidden edit buttons on `390px` screens.
  - **Responsive Grids**: KPI strip flows `1 → 2 (sm) → 4 (xl)` columns; Stock cards flow `1 → 2 (md)` columns; Accounts & Store Settings split `7 / 5` columns on `lg` (`12`-col grid) and stack vertically below `1024px`.
- **58mm Thermal Print Layout (`@media print`)**:
  - Sets `@page { margin: 4mm; size: 58mm auto; }`.
  - Hides all page chrome (`body * { visibility: hidden !important; }`) and isolates `#receipt-printable` pinned at `top: 0; left: 0; width: 100%; max-width: 58mm; padding: 2mm; background: #ffffff; color: #000000; box-shadow: none; border: none; font-size: 11px; line-height: 1.35;`.

### Named Rules
**The Pinned Checkout Rule.** At `>= 1024px`, the POS outer shell locks to `100vh` (`lg:h-screen`) so the checkout total, payment toggle, cash input, and primary `Bayar & Simpan Pesanan` button remain visible above the fold at all times—only the catalog grid and cart line-item list may scroll.

**The 390px Zero-Clipping Rule.** No admin workflow, price edit, status toggle, or report metric may rely on horizontal table scrolling on a `390px` phone; every data table ships a dedicated `< 768px` card layout with 100% action parity.

## Elevation & Depth

This system enforces **single-device elevation**: every layer uses *either* a crisp `1px` border *or* a drop shadow—never both on the same outer container.

Resting surfaces are completely flat (`box-shadow: none`), separated by tonal ground-to-surface contrast (`#f8fafc` ground → `#ffffff` surface → `#f1f5f9` subtle tracks → `#0f172a` high-contrast anchors) and `1px` borders (`#e2e8f0` structural, `#cbd5e1` interactive controls and the `< 1024px` mobile sticky checkout bar). Floating overlays (`ReceiptModal`, `ConfirmModal`, and status/error toasts) drop their outer border and rely exclusively on clean elevation shadows (plus translucent dark scrims behind dialogs).

### Shadow Vocabulary
- **Floating Toast** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` — `shadow-lg`, zero outer border): Elevates bottom-right status/error toasts above the workspace.
- **Modal Dialogs** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)` — `shadow-2xl`, zero outer border, over `rgba(15, 23, 42, 0.50)`–`0.55` scrim): Elevates `ReceiptModal` and `ConfirmModal` above the active counter register or admin dashboard.

### Named Rules
**The Single-Device Elevation Rule.** Resting cards, headers, menu pads, KPI tiles, and the mobile sticky checkout bar use `1px` borders with zero drop shadow; floating modals and toasts use drop shadows with zero outer border. Never stack a drop shadow and a perimeter border on the same container.

## Shapes

Functional, tactile rectangles with restrained radii—friendly enough for bare-finger tapping during a dinner rush, crisp enough to read like a precision register rather than a consumer lifestyle app.

- **Small Radius (`6px`, `rounded-md`)**: Inline cut tags (`PAHA`, `DADA`, `NASI`, `MINUMAN`), order/stock status badges, quick-note modifier chips, quantity count pills, and desktop segmented nav tabs.
- **Medium Radius (`8px`, `rounded-lg`)**: All buttons, form inputs, selects, dining-mode and payment toggles, quick-cash buttons, dark checkout total strip, live stock header pills, and the square brand icon badge (`36px` / `40px`).
- **Large Radius (`12px`, `rounded-xl`)**: Menu touch pads, white dashboard cards, KPI summary tiles, whole-bird restock banner, hero cash-change card, toast banners, and modal containers.
- **Pill Radius (`9999px`, `rounded-full`)**: Proportional progress and stock capacity bars (`6px` / `8px` tall tracks) and custom `6px` thin scrollbars.
- **Dashed Borders (`1px dashed #cbd5e1`)**: Reserved for two explicit cues—out-of-stock disabled menu pads (with `#f1f5f9` fill) and the simulated `58mm` thermal paper receipt preview inside `ReceiptModal`.

## Components

Every component prioritizes instant touch-target recognition (`40–48px` on frequent controls), crisp `1px` borders, and unified keyboard `focus-visible` rings (`2px solid #1d4ed8` with `2px` outer offset on buttons/links/summaries, and `-1px` unified inset offset on inputs/selects/textareas).

### Buttons
- **Shape**: Medium functional corners (`8px` radius).
- **Primary Cobalt**: `#1d4ed8` fill, `#ffffff` SemiBold/Bold `14px` text, `min-height: 40–48px` (`48px` on main POS checkout CTA, `46px` on Login submit, `44px` on `ReceiptModal` print button). Hover `#1e40af`, active `#1e3a8a`. Disabled switches to `#e2e8f0` fill with `#475569` text (`cursor-not-allowed`).
- **Dark Ink Utility**: `#0f172a` fill, `#ffffff` text (`hover: #1e293b`), `min-height: 38–40px`. Used for Admin link, date filter submit (`Terapkan` / `Tampilkan`), and active dining/admin mode anchors.
- **Secondary Outline**: `#ffffff` fill, `1px solid #cbd5e1` border, `#0f172a`/`#1e293b` text (`hover: #f1f5f9` background or `#1d4ed8` border for print-receipt triggers), `min-height: 40–44px`.
- **Destructive Danger**: `#b91c1c` fill (`hover: #991b1b`), `#ffffff` text for confirmed cancellations/deletions; ghost/outline red hover (`#fef2f2` fill, `#991b1b` text, `#fecaca` border) for logout and cart-item removal.
- **Cart Stepper Controls**: Square `40×40px` (`w-10 h-10`) touch buttons (`-`, `+`, `Trash`) with `1px solid #cbd5e1` borders (`+` accents in `#1d4ed8` text with `#eff6ff` hover).
- **Stock Quick-Add Buttons**: `min-height: 40px` (`px-3.5 py-1.5`), `#ecfdf5` fill, `1px solid #a7f3d0`, `#064e3b` `IBM Plex Mono` Bold text (`+5`, `+10`, `+20`), each opening `ConfirmModal` before mutating inventory.

### Chips & Cut Tags
- **Category & Cut Tags**: `11px` Bold uppercase (`tracking-wide`), `6px` radius, `2px 8px` padding, `1px` tinted border (`PAHA` blue, `DADA` amber, `NASI` emerald, `MINUMAN` sky, `LAINNYA` slate).
- **Quick-Note Modifier Chips**: `6px` radius, `min-height: 36px`, `6px 10px` padding, `12px` SemiBold. Unselected uses `#ffffff` with `1px solid #cbd5e1` and `#334155` text; active switches to `#1d4ed8` fill with `#ffffff` text (`aria-pressed`).
- **Quick-Cash Chips**: `4`-column grid (`Pas` + 3 dynamic valid bill suggestions), `8px` radius, `min-height: 38px`, `IBM Plex Mono` Bold `12px`, `#f1f5f9` default → `#1d4ed8` white-text selected; disabled `Pas` uses `#f1f5f9` fill with `#475569` ink (`6.8:1`).

### Cards / Containers & Menu Touch Pads
- **Standard Surface Card**: `#ffffff` background, `1px solid #e2e8f0` border, `12px` radius, `16px–20px` padding, zero shadow.
- **POS Menu Touch Pad**: Full-button card (`min-height: 148px`, `lg:min-height: 176px`, `16px` padding, `12px` radius, flex-column justify-between, tactile `active:scale-[0.985]` press). Top row shows cut tag on left and in-bounds cobalt quantity badge (`N×`, `IBM Plex Mono`) or `HABIS` red pill on right. Middle shows menu title and live remaining stock line (`Sisa X ptg` / `Menipis · sisa X ptg`). Bottom divider shows `IBM Plex Mono` price and a `32×32px` `+` indicator badge.
  - **Rest**: `#ffffff`, `1px solid #e2e8f0`, hover border `#1d4ed8`.
  - **In Cart**: `#eff6ff` (60% tint), `2px solid #1d4ed8`.
  - **Out of Stock**: `#f1f5f9`, `1px dashed #cbd5e1`, disabled cursor.

### Inputs / Fields
- **Style**: `#ffffff` background, `1px solid #cbd5e1` stroke, `8px` radius, `min-height: 38–42px`, `14px` `#0f172a` text (`#64748b` placeholder). Numeric/cash/price fields switch to `IBM Plex Mono` Bold with `tabular-nums`.
- **Focus**: Unified border-ring focus (`outline: 2px solid #1d4ed8; outline-offset: -1px;`) sitting flush over the control stroke without double-ring clutter.
- **Accessibility**: Every input pairs with a visible `<label htmlFor>` or `sr-only` label, proper `inputMode="numeric"` on cash inputs, and leading icons marked `aria-hidden="true"`.

### Navigation
- **POS Top Bar**: Sticky `64px` white header with `1px` bottom hairline. Desktop center hosts a `#f1f5f9` recessed pill track (`4px` padding, `8px` radius, `1px solid #e2e8f0`) with `#ffffff` + `#1d4ed8` active tab buttons (`aria-current="page"`). Mobile stacks a full-width 2-tab bar underneath with `#1d4ed8` active fill.
- **Admin Sub-Navigation**: Horizontal scrollable single-row tab bar pinned under the `64px` header (with a right-edge mobile fade cue); active tab uses `#0f172a` fill with `#ffffff` text (`min-height: 40px`, `8px` radius) to preserve cobalt for action buttons inside the workspace.

### Signature Components
- **Hero Change & 58mm Thermal Receipt Modal (`ReceiptModal`)**: `max-w-md` (`448px`), `max-h-[90vh]` flex-column elevated dialog (`shadow-2xl`, zero outer border, `role="dialog"`, `aria-modal="true"`, `P` keyboard print shortcut, `Escape` close on history views). For newly completed cash orders, opens with a dark `#0f172a` rounded hero card animated with `.receipt-hero-settle` (`240ms cubic-bezier(0.16, 1, 0.3, 1)`, respecting `prefers-reduced-motion`) highlighting `Kembalian Tunai` in `30px` `#34d399` `IBM Plex Mono` (or `Lunas via QRIS` + `TERBAYAR` emerald badge), followed by an internally scrollable `#f8fafc` preview well containing `#receipt-printable` (`1px dashed #cbd5e1`, monospace thermal layout), anchored by twin `44px` `Cetak Struk (P)` and `Order Baru` buttons.
- **Whole-Bird Restock Banner (`StockSection`)**: Full-width `#0f172a` card (`12px` radius, `20px` padding) explicitly surfacing `Restock Cepat per Ekor (1 Ekor = 2 Paha + 2 Dada)`. Keeps the quantity input blank by default (`placeholder="Mis. 5"`) with crisp `#ffffff` input fields and a disabled-until-valid `#2563eb` submit CTA that previews the exact total pieces (`+ Tambah X Ptg`) before submission.
- **Accessible Confirmation Modal (`ConfirmModal`)**: `max-w-md` elevated dialog (`shadow-2xl`, zero outer border, `Escape` dismissible when idle) with `#fef2f2` / `#fecaca` danger header or `#f8fafc` primary header, used to guard quick stock additions (`+5/+10/+20`), menu deletion, and user deletion.

## Do's and Don'ts

### Do:
- **Do** reserve `#1d4ed8` cobalt exclusively for primary CTAs, active selections, and focus rings so rush-hour cashiers spot the next action immediately.
- **Do** render every Rupiah currency amount, order ID, quantity, and stock piece count in self-hosted `IBM Plex Mono` with `tabular-nums`.
- **Do** keep POS primary touch controls at `>= 40px` (`40×40px` cart steppers, `40px` stock quick-adds, `44px` modal actions, `48px` checkout CTA) and preserve unified `focus-visible` rings (`2px` offset on buttons/links, `-1px` offset on inputs/selects/textareas).
- **Do** pair every desktop admin table (`>= 768px`) with a full-parity mobile card list (`< 768px`) so `390px` phone users never encounter clipped columns or hidden edit actions.
- **Do** preserve `#receipt-printable` and `@media print` `58mm auto` black-on-white thermal rules when modifying receipt markup.
- **Do** guard irreversible or bulk inventory actions (quick `+5/+10/+20` restock, order cancel, menu/user delete) with `ConfirmModal` or a timed undo toast.
- **Do** respect `prefers-reduced-motion` whenever applying the `.receipt-hero-settle` (`240ms cubic-bezier(0.16, 1, 0.3, 1)`) motion token.

### Don't:
- **Don't** combine drop shadows and outer borders on the same container—resting cards, headers, KPI tiles, and the mobile sticky checkout bar use `1px` borders only, while modals and toasts use shadows only.
- **Don't** use the same color family for `PAHA` and `DADA` cut pills; keep `PAHA` blue (`#dbeafe`/`#1e3a8a`) and `DADA` amber (`#fef3c7`/`#78350f`).
- **Don't** let the desktop POS checkout button or total scroll below the fold on `1366×768` or `1440×900` screens; keep `/pos` locked to `lg:h-screen` with internal line-item scrolling.
- **Don't** use low-contrast grey text or opacity fades on disabled buttons; use `#475569` on `#e2e8f0` or `#f1f5f9` with actionable status copy.
- **Don't** add decorative uppercase eyebrow kickers, external font CDN dependencies, cream-and-orange restaurant gradients, or unrequested stock counts on non-tracked items (`Nasi`, `Minuman`).
