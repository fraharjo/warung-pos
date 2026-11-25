"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Package,
  Receipt,
  Utensils,
  Settings,
  ShoppingBag,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import type {
  CategoryItem,
  Menu,
  Order,
  SalesReport,
  SessionUser,
  StockLog,
  StoreSettings,
  User,
} from "@/lib/types";
import { ReportsSection } from "./ReportsSection";
import { StockSection } from "./StockSection";
import { OrdersSection } from "./OrdersSection";
import { MenusSection } from "./MenusSection";
import { UsersSettingsSection } from "./UsersSettingsSection";

type AdminTab = "reports" | "stock" | "orders" | "menus" | "settings";

interface AdminClientProps {
  user: SessionUser;
  dbMode: "postgres" | "local";
  initialReport: SalesReport;
  initialMenus: Menu[];
  initialCategories: CategoryItem[];
  initialStockLogs: StockLog[];
  initialOrders: Order[];
  initialUsers: User[];
  initialSettings: StoreSettings;
}

const TABS: Array<{ id: AdminTab; label: string; icon: typeof BarChart3 }> = [
  { id: "reports", label: "Laporan", icon: BarChart3 },
  { id: "stock", label: "Stok Menu", icon: Package },
  { id: "orders", label: "Pesanan", icon: Receipt },
  { id: "menus", label: "Menu & Harga", icon: Utensils },
  { id: "settings", label: "Pengaturan", icon: Settings },
];

export function AdminClient({
  user,
  dbMode,
  initialReport,
  initialMenus,
  initialCategories,
  initialStockLogs,
  initialOrders,
  initialUsers,
  initialSettings,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("reports");
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabButtonRefs = useRef<Partial<Record<AdminTab, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const el = tabButtonRefs.current[activeTab];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "instant", inline: "center", block: "nearest" });
    }
  }, [activeTab]);

  function showToast(type: "success" | "error", message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, type === "error" ? 5000 : 3500);
  }

  function dismissToast() {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full min-w-0 bg-white border-b border-slate-200">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 min-w-0">
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
                Admin • <span className="font-semibold text-slate-800">{user.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/pos"
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 transition whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Buka Kasir</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar dari akun"
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-800 text-slate-700 text-xs sm:text-sm font-semibold px-3 py-2 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs — auto-centers active tab on mobile with scroll edge cue */}
        <nav
          aria-label="Navigasi Dashboard Admin"
          className="relative w-full min-w-0 border-t border-slate-200 bg-white overflow-hidden"
        >
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-2 pr-8 sm:pr-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabButtonRefs.current[tab.id] = node;
                  }}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[40px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className="sm:hidden pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-white to-transparent"
          />
        </nav>
      </header>

      {/* Accessible Toast */}
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          aria-live={toast.type === "error" ? "assertive" : "polite"}
          className="fixed bottom-5 right-4 sm:right-5 z-50 max-w-sm"
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
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Tutup notifikasi"
              className="p-1 rounded text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {activeTab === "reports" && (
          <ReportsSection
            initialReport={initialReport}
            categories={categories}
            onNotify={showToast}
          />
        )}
        {activeTab === "stock" && (
          <StockSection
            initialStockMenus={initialMenus.filter((m) => m.trackStock)}
            initialLogs={initialStockLogs}
            onNotify={showToast}
          />
        )}
        {activeTab === "orders" && (
          <OrdersSection
            initialOrders={initialOrders}
            settings={settings}
            onNotify={showToast}
          />
        )}
        {activeTab === "menus" && (
          <MenusSection
            initialMenus={initialMenus}
            categories={categories}
            onCategoriesChange={setCategories}
            onNotify={showToast}
          />
        )}
        {activeTab === "settings" && (
          <UsersSettingsSection
            currentUserId={user.userId}
            initialUsers={initialUsers}
            initialSettings={settings}
            dbMode={dbMode}
            onSettingsUpdated={setSettings}
            onNotify={showToast}
          />
        )}
      </main>
    </div>
  );
}
