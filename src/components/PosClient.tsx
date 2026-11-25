"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Banknote,
  QrCode,
  Printer,
  LogOut,
  History,
  LayoutDashboard,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  formatRupiah,
  formatTimeWIB,
} from "@/lib/format";
import type {
  CategoryItem,
  Menu,
  Order,
  PaymentMethod,
  SessionUser,
  StoreSettings,
} from "@/lib/types";
import { ReceiptModal } from "./ReceiptModal";
import { BrandLogo } from "./BrandLogo";

interface PosClientProps {
  user: SessionUser;
  initialMenus: Menu[];
  initialOrders: Order[];
  initialCategories: CategoryItem[];
  settings: StoreSettings;
}

interface CartEntry {
  menu: Menu;
  quantity: number;
}

type DiningMode = "dine_in" | "takeaway";

interface DraftSnapshot {
  cart: Record<number, number>;
  diningMode: DiningMode;
  selectedChips: string[];
  customerName: string;
  notes: string;
  paymentMethod: PaymentMethod;
  cashInput: string;
}

const DRAFT_STORAGE_KEY = "warung_pos_draft_v1";

const QUICK_NOTE_CHIPS = [
  "Pedas",
  "Tidak Pedas",
  "Pisah Kuah/Sambal",
  "Kurangi Es",
] as const;

const HISTORY_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

function getMenuTag(
  menu: Menu,
  categoryMap: Record<string, string>
): { label: string; className: string } {
  const customLabel = (
    categoryMap[menu.category] ||
    CATEGORY_LABELS[menu.category] ||
    menu.category
  ).toUpperCase();

  if (menu.category === "makanan") {
    return {
      label: customLabel,
      className: "bg-blue-100 text-blue-900 border-blue-200",
    };
  }
  if (menu.category === "nasi") {
    return {
      label: customLabel,
      className: "bg-emerald-100 text-emerald-900 border-emerald-200",
    };
  }
  if (menu.category === "minuman") {
    return {
      label: customLabel,
      className: "bg-sky-100 text-sky-900 border-sky-200",
    };
  }
  if (menu.category === "snack") {
    return {
      label: customLabel,
      className: "bg-amber-100 text-amber-900 border-amber-300",
    };
  }
  return {
    label: customLabel,
    className: "bg-slate-200 text-slate-800 border-slate-300",
  };
}

function getQuickCashOptions(total: number): number[] {
  if (total <= 0) return [20000, 50000, 100000];
  const candidates = new Set<number>();
  const round5k = Math.ceil(total / 5000) * 5000;
  const round10k = Math.ceil(total / 10000) * 10000;
  const round50k = Math.ceil(total / 50000) * 50000;

  if (round5k > total) candidates.add(round5k);
  if (round10k > total) candidates.add(round10k);
  for (const bill of [20000, 50000, 100000, 150000, 200000]) {
    if (bill > total) candidates.add(bill);
  }
  if (round50k > total) candidates.add(round50k);

  return Array.from(candidates)
    .sort((a, b) => a - b)
    .slice(0, 3);
}

export function PosClient({
  user,
  initialMenus,
  initialOrders,
  initialCategories,
  settings,
}: PosClientProps) {
  const [activeTab, setActiveTab] = useState<"order" | "history">("order");
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [categoryList, setCategoryList] =
    useState<CategoryItem[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart & Warung Order state
  const [cart, setCart] = useState<Record<number, number>>({});
  const [diningMode, setDiningMode] = useState<DiningMode>("dine_in");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = useState("");
  const [hydratedDraft, setHydratedDraft] = useState(false);

  // UI feedback
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    type: "error" | "success";
    message: string;
    undoSnapshot?: DraftSnapshot;
  } | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptIsNew, setReceiptIsNew] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [historyPageSize, setHistoryPageSize] = useState<number>(10);
  const [historyPage, setHistoryPage] = useState<number>(1);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const cartPanelRef = useRef<HTMLElement | null>(null);

  function showToast(
    type: "error" | "success",
    message: string,
    undoSnapshot?: DraftSnapshot
  ) {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ type, message, undoSnapshot });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, undoSnapshot ? 6000 : type === "error" ? 5000 : 3500);
  }

  function dismissToast() {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DraftSnapshot>;
        if (parsed.cart && typeof parsed.cart === "object") {
          const validCart: Record<number, number> = {};
          for (const [idStr, qty] of Object.entries(parsed.cart)) {
            const id = Number(idStr);
            const menu = initialMenus.find((m) => m.id === id);
            if (menu && typeof qty === "number" && qty > 0) {
              const clamped = menu.trackStock
                ? Math.min(qty, Math.max(0, menu.stock))
                : qty;
              if (clamped > 0) validCart[id] = clamped;
            }
          }
          setCart(validCart);
        }
        if (parsed.diningMode === "dine_in" || parsed.diningMode === "takeaway") {
          setDiningMode(parsed.diningMode);
        }
        if (Array.isArray(parsed.selectedChips)) {
          setSelectedChips(parsed.selectedChips);
        }
        if (typeof parsed.customerName === "string") {
          setCustomerName(parsed.customerName);
          if (parsed.customerName.trim()) setShowExtraFields(true);
        }
        if (typeof parsed.notes === "string") {
          setNotes(parsed.notes);
          if (parsed.notes.trim()) setShowExtraFields(true);
        }
        if (parsed.paymentMethod === "cash" || parsed.paymentMethod === "qris") {
          setPaymentMethod(parsed.paymentMethod);
        }
        if (typeof parsed.cashInput === "string") {
          setCashInput(parsed.cashInput);
        }
      }
    } catch {
      // Ignore storage parsing errors
    } finally {
      setHydratedDraft(true);
    }
  }, [initialMenus]);

  // Save draft to sessionStorage whenever state changes
  useEffect(() => {
    if (!hydratedDraft) return;
    try {
      const draft: DraftSnapshot = {
        cart,
        diningMode,
        selectedChips,
        customerName,
        notes,
        paymentMethod,
        cashInput,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore quota errors
    }
  }, [
    hydratedDraft,
    cart,
    diningMode,
    selectedChips,
    customerName,
    notes,
    paymentMethod,
    cashInput,
  ]);

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Keyboard shortcut: "/" focuses menu search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (receiptOrder) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (
        e.key === "/" &&
        activeTab === "order" &&
        tag !== "INPUT" &&
        tag !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab, receiptOrder]);

  // Track whether #cart-panel is visible on mobile/tablet so sticky bar never duplicates it
  useEffect(() => {
    const el = cartPanelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setCartVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);

  async function refreshData() {
    setRefreshing(true);
    try {
      const [menusRes, ordersRes, catRes] = await Promise.all([
        fetch("/api/menus"),
        fetch("/api/orders"),
        fetch("/api/categories"),
      ]);
      if (menusRes.ok) {
        const d = await menusRes.json();
        setMenus(d.menus);
      }
      if (ordersRes.ok) {
        const d = await ordersRes.json();
        setOrders(d.orders);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        if (Array.isArray(d.categories)) setCategoryList(d.categories);
      }
    } catch {
      showToast("error", "Gagal menyegarkan data. Periksa koneksi jaringan.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  const categoryMap = useMemo(
    () => Object.fromEntries(categoryList.map((c) => [c.slug, c.name])),
    [categoryList]
  );

  const categories = useMemo(() => {
    const present = new Set(menus.map((m) => m.category));
    const list: Array<{ key: string; label: string }> = [
      { key: "all", label: "Semua" },
    ];
    const added = new Set<string>();
    for (const cat of categoryList) {
      if (present.has(cat.slug)) {
        list.push({ key: cat.slug, label: cat.name });
        added.add(cat.slug);
      }
    }
    for (const slug of present) {
      if (!added.has(slug)) {
        list.push({
          key: slug,
          label: CATEGORY_LABELS[slug] || slug,
        });
      }
    }
    return list;
  }, [menus, categoryList]);

  const filteredMenus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menus.filter((m) => {
      if (selectedCategory !== "all" && m.category !== selectedCategory) {
        return false;
      }
      if (q && !m.name.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [menus, selectedCategory, searchQuery]);

  const cartEntries: CartEntry[] = useMemo(() => {
    const entries: CartEntry[] = [];
    for (const [menuIdStr, qty] of Object.entries(cart)) {
      if (qty <= 0) continue;
      const menu = menus.find((m) => m.id === Number(menuIdStr));
      if (menu) entries.push({ menu, quantity: qty });
    }
    return entries;
  }, [cart, menus]);

  const totalItems = useMemo(
    () => cartEntries.reduce((sum, e) => sum + e.quantity, 0),
    [cartEntries]
  );

  const totalAmount = useMemo(
    () => cartEntries.reduce((sum, e) => sum + e.menu.price * e.quantity, 0),
    [cartEntries]
  );

  const parsedCash = Number(cashInput.replace(/[^0-9]/g, "")) || 0;
  const effectivePaid = paymentMethod === "qris" ? totalAmount : parsedCash;
  const changeAmount = effectivePaid - totalAmount;
  const quickCashOptions = useMemo(
    () => getQuickCashOptions(totalAmount),
    [totalAmount]
  );

  function addToCart(menu: Menu) {
    const currentQty = cart[menu.id] ?? 0;
    if (menu.trackStock) {
      if (menu.stock <= 0) {
        showToast("error", `Stok ${menu.name} sedang habis`);
        return;
      }
      if (currentQty >= menu.stock) {
        showToast(
          "error",
          `Maksimal stok ${menu.name} tersedia: ${menu.stock} potong`
        );
        return;
      }
    }
    setCart((prev) => ({ ...prev, [menu.id]: currentQty + 1 }));
  }

  function updateCartQty(menu: Menu, delta: number) {
    const currentQty = cart[menu.id] ?? 0;
    const nextQty = currentQty + delta;
    if (nextQty <= 0) {
      setCart((prev) => {
        const copy = { ...prev };
        delete copy[menu.id];
        return copy;
      });
      return;
    }
    if (menu.trackStock && nextQty > menu.stock) {
      showToast(
        "error",
        `Stok ${menu.name} tersisa ${menu.stock} potong`
      );
      return;
    }
    setCart((prev) => ({ ...prev, [menu.id]: nextQty }));
  }

  function toggleChip(chip: string) {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  }

  function resetDraftState() {
    setCart({});
    setDiningMode("dine_in");
    setSelectedChips([]);
    setCustomerName("");
    setNotes("");
    setShowExtraFields(false);
    setCashInput("");
  }

  function handleClearCartWithUndo() {
    if (cartEntries.length === 0) return;
    const snapshot: DraftSnapshot = {
      cart: { ...cart },
      diningMode,
      selectedChips: [...selectedChips],
      customerName,
      notes,
      paymentMethod,
      cashInput,
    };
    resetDraftState();
    showToast("success", "Keranjang dikosongkan", snapshot);
  }

  function restoreSnapshot(snapshot: DraftSnapshot) {
    setCart(snapshot.cart);
    setDiningMode(snapshot.diningMode);
    setSelectedChips(snapshot.selectedChips);
    setCustomerName(snapshot.customerName);
    setNotes(snapshot.notes);
    setPaymentMethod(snapshot.paymentMethod);
    setCashInput(snapshot.cashInput);
    if (snapshot.customerName.trim() || snapshot.notes.trim()) {
      setShowExtraFields(true);
    }
    dismissToast();
  }

  function composeOrderNotes(): string {
    const parts: string[] = [];
    parts.push(diningMode === "takeaway" ? "Bungkus" : "Makan Sini");
    if (selectedChips.length > 0) {
      parts.push(selectedChips.join(", "));
    }
    if (notes.trim()) {
      parts.push(notes.trim());
    }
    return parts.join(" • ");
  }

  async function handleCheckout(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (cartEntries.length === 0) {
      showToast("error", "Pilih minimal 1 menu terlebih dahulu");
      return;
    }
    if (paymentMethod === "cash" && parsedCash < totalAmount) {
      showToast("error", "Nominal uang tunai kurang dari total pesanan");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          paymentMethod,
          amountPaid: effectivePaid,
          notes: composeOrderNotes(),
          items: cartEntries.map((entry) => ({
            menuId: entry.menu.id,
            quantity: entry.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Gagal menyimpan pesanan");
        await refreshData();
        return;
      }

      resetDraftState();
      setReceiptOrder(data.order);
      setReceiptIsNew(true);
      await refreshData();
    } catch {
      showToast("error", "Koneksi gagal, silakan coba simpan lagi");
    } finally {
      setSubmitting(false);
    }
  }

  const stockMenus = useMemo(
    () => menus.filter((m) => m.trackStock),
    [menus]
  );

  const completedTodayCount = useMemo(
    () => orders.filter((o) => o.status === "completed").length,
    [orders]
  );

  const completedTodayRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );

  const historyTotalPages = Math.max(
    1,
    Math.ceil(orders.length / historyPageSize)
  );
  const safeHistoryPage = Math.min(historyPage, historyTotalPages);

  const paginatedHistoryOrders = useMemo(() => {
    const start = (safeHistoryPage - 1) * historyPageSize;
    return orders.slice(start, start + historyPageSize);
  }, [orders, safeHistoryPage, historyPageSize]);

  const historyStartIdx =
    orders.length === 0 ? 0 : (safeHistoryPage - 1) * historyPageSize + 1;
  const historyEndIdx = Math.min(
    safeHistoryPage * historyPageSize,
    orders.length
  );

  const canCheckout =
    !submitting &&
    cartEntries.length > 0 &&
    (paymentMethod === "qris" || parsedCash >= totalAmount);

  const checkoutButtonLabel = submitting
    ? "Menyimpan Pesanan..."
    : cartEntries.length === 0
    ? "Pilih Menu Dulu"
    : paymentMethod === "cash" && parsedCash === 0
    ? "Masukkan Uang Tunai"
    : paymentMethod === "cash" && parsedCash < totalAmount
    ? `Kurang ${formatRupiah(totalAmount - parsedCash)}`
    : "Bayar & Simpan Pesanan";

  return (
    <div
      className={`w-full max-w-full overflow-x-clip flex flex-col bg-[#F8FAFC] text-slate-900 ${
        activeTab === "order"
          ? "min-h-screen lg:h-screen lg:overflow-hidden"
          : "min-h-screen"
      }`}
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 shrink-0 bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo
              logoUrl={settings.storeLogo}
              storeName={settings.storeName}
              size="sm"
            />
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 text-base leading-tight truncate">
                {settings.storeName}
              </h1>
              <p className="text-xs text-slate-600 truncate">
                Kasir: <span className="font-semibold text-slate-800">{user.name}</span>
              </p>
            </div>
          </div>

          {/* Center Mode Switch (Desktop) */}
          <nav
            aria-label="Navigasi Kasir"
            className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200"
          >
            <button
              type="button"
              onClick={() => setActiveTab("order")}
              aria-current={activeTab === "order" ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === "order"
                  ? "bg-white text-blue-700 border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 border border-transparent"
              }`}
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>Kasir</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("history");
                refreshData();
              }}
              aria-current={activeTab === "history" ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === "history"
                  ? "bg-white text-blue-700 border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 border border-transparent"
              }`}
            >
              <History className="w-4 h-4" aria-hidden="true" />
              <span>Riwayat</span>
              <span className="ml-0.5 text-xs font-mono bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded tabular-nums">
                {orders.length}
              </span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={refreshData}
              disabled={refreshing}
              aria-label="Segarkan stok dan riwayat"
              title="Segarkan stok & riwayat"
              className="w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>

            {user.role === "admin" && (
              <Link
                href="/admin"
                className="min-h-[40px] flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 transition whitespace-nowrap"
              >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar dari akun"
              className="min-h-[40px] flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-800 text-slate-700 text-xs sm:text-sm font-semibold px-3 py-2 transition cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden border-t border-slate-200 px-4 py-2 flex gap-2 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("order")}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "order"
                ? "bg-blue-700 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Kasir</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              refreshData();
            }}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "history"
                ? "bg-blue-700 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Riwayat ({orders.length})</span>
          </button>
        </div>
      </header>

      {/* Accessible Toast Notification */}
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          aria-live={toast.type === "error" ? "assertive" : "polite"}
          className="fixed bottom-20 lg:bottom-5 right-4 sm:right-5 z-50 max-w-sm"
        >
          <div
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.type === "error"
                ? "bg-red-700 text-white"
                : "bg-slate-900 text-white"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2
                className="w-4 h-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
            )}
            <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
              {toast.message}
            </span>
            {toast.undoSnapshot && (
              <button
                type="button"
                onClick={() => restoreSnapshot(toast.undoSnapshot!)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold whitespace-nowrap cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Batalkan</span>
              </button>
            )}
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Tutup notifikasi"
              className="p-1 rounded-md text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Surface */}
      {activeTab === "order" ? (
        <main className="flex-1 lg:min-h-0 max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row lg:overflow-hidden">
          {/* LEFT: Menu Catalog Workspace */}
          <section className="flex-1 lg:min-h-0 lg:overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
            {/* Category Filter + Quick Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div
                className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5"
                role="tablist"
                aria-label="Kategori Menu"
              >
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`min-h-[40px] px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                      selectedCategory === cat.key
                        ? "bg-blue-700 text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-56 shrink-0">
                <Search
                  className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  aria-label="Cari menu"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu... (/)"
                  className="w-full min-h-[40px] rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-700 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Menu Pad Grid */}
            {filteredMenus.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 py-14 px-4 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  Menu tidak ditemukan
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Coba pilih kategori &ldquo;Semua&rdquo; atau hapus kata kunci pencarian.
                </p>
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-3 px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    Tampilkan Semua Menu
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredMenus.map((menu) => {
                  const qtyInCart = cart[menu.id] ?? 0;
                  const remaining = menu.trackStock
                    ? Math.max(0, menu.stock - qtyInCart)
                    : null;
                  const outOfStock = menu.trackStock && menu.stock <= 0;
                  const lowStock =
                    remaining !== null && remaining > 0 && remaining <= 5;
                  const atMaxStock = menu.trackStock && qtyInCart >= menu.stock;
                  const tag = getMenuTag(menu, categoryMap);

                  return (
                    <button
                      key={menu.id}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => addToCart(menu)}
                      className={`group relative text-left rounded-xl p-4 border transition flex flex-col justify-between min-h-[148px] lg:min-h-[176px] ${
                        outOfStock
                          ? "bg-slate-100 border-dashed border-slate-300 text-slate-600 cursor-not-allowed"
                          : qtyInCart > 0
                          ? "bg-blue-50/60 border-2 border-blue-700 cursor-pointer active:scale-[0.985]"
                          : "bg-white border-slate-200 hover:border-blue-700 cursor-pointer active:scale-[0.985]"
                      }`}
                    >
                      <div>
                        {/* Top Tag + In-Bounds Quantity Pill */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold tracking-wide whitespace-nowrap ${tag.className}`}
                          >
                            {tag.label}
                          </span>

                          {qtyInCart > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-md bg-blue-700 text-white text-xs font-bold font-mono tabular-nums">
                              {qtyInCart}×
                            </span>
                          ) : outOfStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[11px] font-bold whitespace-nowrap">
                              HABIS
                            </span>
                          ) : null}
                        </div>

                        <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                          {menu.name}
                        </h2>

                        {menu.trackStock && !outOfStock && remaining !== null && (
                          <p
                            className={`text-xs font-semibold mt-1 tabular-nums ${
                              remaining === 0
                                ? "text-red-700"
                                : lowStock
                                ? "text-amber-800"
                                : "text-emerald-800"
                            }`}
                          >
                            {remaining === 0
                              ? "Maksimal di keranjang"
                              : lowStock
                              ? `Menipis · sisa ${remaining} porsi`
                              : `Sisa ${remaining} porsi`}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm sm:text-base tabular-nums">
                          {formatRupiah(menu.price)}
                        </span>
                        {!outOfStock && (
                          <span
                            aria-hidden="true"
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                              atMaxStock
                                ? "bg-slate-200 text-slate-500"
                                : qtyInCart > 0
                                ? "bg-blue-700 text-white"
                                : "bg-slate-100 text-slate-800 group-hover:bg-blue-700 group-hover:text-white"
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* RIGHT: Full-Height Pinned Cart & Checkout Dock */}
          <aside
            id="cart-panel"
            ref={cartPanelRef}
            className="w-full lg:w-[420px] xl:w-[440px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col lg:h-full"
          >
            {/* Cart Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">
                  Pesanan Aktif
                </h2>
                {totalItems > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-bold font-mono tabular-nums">
                    {totalItems} item
                  </span>
                )}
              </div>
              {cartEntries.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCartWithUndo}
                  className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-700 hover:bg-red-50 transition cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* 1-Tap Dining Mode Toggle (Makan Sini / Bungkus) */}
            <div className="px-5 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div
                className="grid grid-cols-2 gap-1.5"
                role="group"
                aria-label="Jenis pesanan"
              >
                <button
                  type="button"
                  aria-pressed={diningMode === "dine_in"}
                  onClick={() => setDiningMode("dine_in")}
                  className={`min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    diningMode === "dine_in"
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-400"
                  }`}
                >
                  Makan Sini
                </button>
                <button
                  type="button"
                  aria-pressed={diningMode === "takeaway"}
                  onClick={() => setDiningMode("takeaway")}
                  className={`min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    diningMode === "takeaway"
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-400"
                  }`}
                >
                  Bungkus
                </button>
              </div>
            </div>

            {/* Scrollable Line Items */}
            <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-5 py-3 divide-y divide-slate-200">
              {cartEntries.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingBag
                    className="w-8 h-8 mx-auto mb-2 text-slate-400"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-slate-700">
                    Belum ada menu dipilih
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ketuk menu untuk mulai mencatat pesanan.
                  </p>
                </div>
              ) : (
                cartEntries.map(({ menu, quantity }) => (
                  <div
                    key={menu.id}
                    className="py-3 flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-900 truncate">
                        {menu.name}
                      </div>
                      <div className="text-xs text-slate-600 font-mono tabular-nums mt-0.5">
                        {formatRupiah(menu.price)} × {quantity} ={" "}
                        <span className="font-bold text-slate-900">
                          {formatRupiah(menu.price * quantity)}
                        </span>
                      </div>
                    </div>

                    {/* 40x40px Rush-Hour Touch Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartQty(menu, -1)}
                        className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-800 cursor-pointer"
                        aria-label={`Kurangi ${menu.name}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold font-mono tabular-nums text-slate-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(menu, 1)}
                        className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-700 flex items-center justify-center text-blue-700 cursor-pointer"
                        aria-label={`Tambah ${menu.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCartQty(menu, -quantity)}
                        className="w-10 h-10 ml-1 rounded-lg border border-transparent text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 flex items-center justify-center cursor-pointer"
                        aria-label={`Hapus ${menu.name} dari keranjang`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Warung Modifiers + Collapsible Optional Customer/Notes */}
            <div className="px-5 py-2.5 border-t border-slate-200 bg-slate-50 space-y-2 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK_NOTE_CHIPS.map((chip) => {
                  const active = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleChip(chip)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-md text-xs font-semibold border transition cursor-pointer ${
                        active
                          ? "bg-blue-700 text-white border-blue-700"
                          : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowExtraFields((v) => !v)}
                  aria-expanded={showExtraFields}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                >
                  <span>
                    {customerName || notes
                      ? "Edit Nama / Catatan"
                      : "+ Nama / Catatan"}
                  </span>
                  {showExtraFields ? (
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>

              {showExtraFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pt-1">
                  <div>
                    <label htmlFor="pos-customer-name" className="sr-only">
                      Nama pelanggan atau nomor meja
                    </label>
                    <input
                      id="pos-customer-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nama pelanggan / meja (opsional)"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="pos-order-notes" className="sr-only">
                      Catatan tambahan
                    </label>
                    <input
                      id="pos-order-notes"
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan tambahan (opsional)"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pinned Checkout Form (Enter submits cleanly) */}
            <form
              onSubmit={handleCheckout}
              className="px-5 py-4 border-t border-slate-200 bg-white space-y-3 shrink-0"
            >
              {/* Total Strip */}
              <div className="rounded-lg bg-slate-900 text-white px-4 py-3 flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-slate-300">
                    Total Order ({totalItems} item)
                  </div>
                </div>
                <div className="text-2xl font-extrabold font-mono tracking-tight tabular-nums text-white">
                  {formatRupiah(totalAmount)}
                </div>
              </div>

              {/* Payment Method Toggle */}
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Metode pembayaran"
              >
                <button
                  type="button"
                  aria-pressed={paymentMethod === "cash"}
                  onClick={() => setPaymentMethod("cash")}
                  className={`min-h-[42px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-semibold transition cursor-pointer ${
                    paymentMethod === "cash"
                      ? "bg-blue-50 border-blue-700 text-blue-800"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Banknote className="w-4 h-4" aria-hidden="true" />
                  <span>Tunai</span>
                </button>
                <button
                  type="button"
                  aria-pressed={paymentMethod === "qris"}
                  onClick={() => setPaymentMethod("qris")}
                  className={`min-h-[42px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-semibold transition cursor-pointer ${
                    paymentMethod === "qris"
                      ? "bg-blue-50 border-blue-700 text-blue-800"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <QrCode className="w-4 h-4" aria-hidden="true" />
                  <span>QRIS</span>
                </button>
              </div>

              {paymentMethod === "cash" ? (
                <div className="space-y-2">
                  <div className="relative">
                    <label htmlFor="pos-cash-input" className="sr-only">
                      Uang tunai diterima (Rupiah)
                    </label>
                    <span
                      aria-hidden="true"
                      className="text-sm font-bold text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2"
                    >
                      Rp
                    </span>
                    <input
                      id="pos-cash-input"
                      type="text"
                      inputMode="numeric"
                      value={cashInput}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, "");
                        setCashInput(
                          digits ? Number(digits).toLocaleString("id-ID") : ""
                        );
                      }}
                      placeholder="Uang diterima..."
                      className="w-full min-h-[42px] rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm font-bold font-mono text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-500 tabular-nums focus:border-blue-700"
                    />
                  </div>

                  {/* Dynamic Valid Quick-Cash Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      disabled={totalAmount === 0}
                      onClick={() =>
                        setCashInput(
                          totalAmount > 0
                            ? totalAmount.toLocaleString("id-ID")
                            : ""
                        )
                      }
                      className={`min-h-[38px] py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                        totalAmount === 0
                          ? "bg-slate-100 text-slate-600 cursor-not-allowed"
                          : parsedCash === totalAmount
                          ? "bg-blue-700 text-white cursor-pointer"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                      }`}
                    >
                      Pas
                    </button>
                    {quickCashOptions.map((val) => {
                      const isSelected = parsedCash === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setCashInput(val.toLocaleString("id-ID"))
                          }
                          className={`min-h-[38px] py-1.5 px-2 rounded-lg text-xs font-bold font-mono tabular-nums transition cursor-pointer ${
                            isSelected
                              ? "bg-blue-700 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                          }`}
                        >
                          {val / 1000}rb
                        </button>
                      );
                    })}
                  </div>

                  {/* Live Change / Shortage Readout */}
                  {totalAmount > 0 && parsedCash > 0 && (
                    <div
                      className={`flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-bold border ${
                        changeAmount >= 0
                          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      <span>
                        {changeAmount >= 0 ? "Kembalian" : "Uang Kurang"}
                      </span>
                      <span className="text-sm font-mono tabular-nums">
                        {formatRupiah(Math.abs(changeAmount))}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 flex items-center justify-between">
                  <span>Pastikan pembayaran QRIS sudah masuk</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              )}

              {/* Primary Checkout CTA — High Contrast Cobalt, Clear Disabled State */}
              <button
                type="submit"
                disabled={!canCheckout}
                className={`w-full min-h-[48px] py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${
                  canCheckout
                    ? "bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-600 cursor-not-allowed"
                }`}
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                <span>{checkoutButtonLabel}</span>
              </button>
            </form>
          </aside>
        </main>
      ) : (
        /* TODAY HISTORY TAB */
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-600">
                Pesanan Selesai Hari Ini
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {completedTodayCount} transaksi
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-600">
                Total Omzet Hari Ini
              </div>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
                {formatRupiah(completedTodayRevenue)}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-600">
                Sisa Stok Menu
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {stockMenus.map((m) => (
                  <span
                    key={m.id}
                    className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md border tabular-nums ${
                      m.stock === 0
                        ? "bg-red-50 text-red-800 border-red-200"
                        : m.stock <= 5
                        ? "bg-amber-50 text-amber-900 border-amber-300"
                        : "bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    {m.name}: {m.stock} porsi
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  Riwayat Transaksi Hari Ini{" "}
                  <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                    ({orders.length})
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pembatalan pesanan dilakukan oleh Admin di menu Pesanan agar stok tercatat rapi.
                </p>
              </div>
              {orders.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <label htmlFor="pos-history-page-size" className="font-semibold">
                    Tampilkan:
                  </label>
                  <select
                    id="pos-history-page-size"
                    value={historyPageSize}
                    onChange={(e) => {
                      setHistoryPageSize(Number(e.target.value));
                      setHistoryPage(1);
                    }}
                    className="min-h-[34px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900"
                  >
                    {HISTORY_PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} / halaman
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="py-14 px-4 text-center">
                <History
                  className="w-8 h-8 mx-auto mb-2 text-slate-400"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-slate-700">
                  Belum ada transaksi hari ini
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("order")}
                  className="mt-3 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Buat Pesanan Pertama
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-200">
                  {paginatedHistoryOrders.map((order) => (
                  <div
                    key={order.id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs font-mono text-slate-600">
                          {formatTimeWIB(order.createdAt)} WIB
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                            order.status === "completed"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.status === "completed"
                            ? "Selesai"
                            : "Dibatalkan"}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                          {order.paymentMethod === "cash" ? "Tunai" : "QRIS"}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-900">
                        {order.customerName}
                      </div>

                      <div className="text-xs text-slate-600">
                        {order.items
                          .map((i) => `${i.quantity}× ${i.menuName}`)
                          .join(" • ")}
                      </div>

                      {order.notes && (
                        <div className="text-xs text-slate-600">
                          Catatan: {order.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div
                          className={`font-mono font-bold text-base tabular-nums ${
                            order.status === "cancelled"
                              ? "line-through text-slate-500"
                              : "text-slate-900"
                          }`}
                        >
                          {formatRupiah(order.totalAmount)}
                        </div>
                        <div className="text-xs text-slate-600">
                          Kasir: {order.cashierName}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReceiptOrder(order);
                          setReceiptIsNew(false);
                        }}
                        className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:border-blue-700 hover:text-blue-700 text-slate-800 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                      >
                        <Printer className="w-4 h-4" aria-hidden="true" />
                        <span>Struk</span>
                      </button>
                    </div>
                  </div>
                ))}
                </div>

                {/* Pagination Footer */}
                <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 font-mono tabular-nums">
                    Menampilkan <strong>{historyStartIdx}</strong>–
                    <strong>{historyEndIdx}</strong> dari{" "}
                    <strong>{orders.length}</strong> transaksi
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <button
                      type="button"
                      disabled={safeHistoryPage <= 1}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      className={`min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition whitespace-nowrap ${
                        safeHistoryPage <= 1
                          ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-white border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      <span>Sebelumnya</span>
                    </button>

                    <span className="text-xs font-semibold font-mono text-slate-700 px-2 tabular-nums whitespace-nowrap">
                      Hal {safeHistoryPage} / {historyTotalPages}
                    </span>

                    <button
                      type="button"
                      disabled={safeHistoryPage >= historyTotalPages}
                      onClick={() =>
                        setHistoryPage((p) =>
                          Math.min(historyTotalPages, p + 1)
                        )
                      }
                      className={`min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition whitespace-nowrap ${
                        safeHistoryPage >= historyTotalPages
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
        </main>
      )}

      {/* Smart Mobile Sticky Bar — hides automatically when #cart-panel is in viewport */}
      {activeTab === "order" && totalItems > 0 && !cartVisible && (
        <div className="lg:hidden sticky bottom-0 z-20 bg-white border-t border-slate-300 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-600">
              {totalItems} item dipilih
            </div>
            <div className="font-mono font-extrabold text-lg text-slate-900 tabular-nums">
              {formatRupiah(totalAmount)}
            </div>
          </div>
          <a
            href="#cart-panel"
            className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold whitespace-nowrap"
          >
            Lanjut Bayar
          </a>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        order={receiptOrder}
        settings={settings}
        isNewOrder={receiptIsNew}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
}
