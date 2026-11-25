"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Tag,
  Search,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { CATEGORY_LABELS, formatRupiah } from "@/lib/format";
import type { CategoryItem, Menu, MenuCategory } from "@/lib/types";
import { ConfirmModal } from "../ConfirmModal";

type MenuSortOption =
  | "default"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "stock_desc";

const MAX_MENU_NAME_LENGTH = 50;
const MAX_CATEGORY_NAME_LENGTH = 30;
const MAX_MENU_PRICE = 9_999_999;
const MAX_PRICE_DIGITS = 7;

function isWithinPriceDigitLimit(value: string): boolean {
  return value.replace(/[^0-9]/g, "").length <= MAX_PRICE_DIGITS;
}

interface AddMenuErrors {
  name?: string;
  price?: string;
  stock?: string;
}

interface MenusSectionProps {
  initialMenus: Menu[];
  categories: CategoryItem[];
  onCategoriesChange: (categories: CategoryItem[]) => void;
  onNotify: (type: "success" | "error", message: string) => void;
}

export function MenusSection({
  initialMenus,
  categories,
  onCategoriesChange,
  onNotify,
}: MenusSectionProps) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [showAdd, setShowAdd] = useState(false);

  // Category manager state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<CategoryItem | null>(
    null
  );
  const [deletingCategory, setDeletingCategory] = useState(false);

  // Add menu form state
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<MenuCategory>(
    categories[0]?.slug || "ayam"
  );
  const [newPrice, setNewPrice] = useState("");
  const [newTrackStock, setNewTrackStock] = useState(false);
  const [newStock, setNewStock] = useState("0");
  const [addErrors, setAddErrors] = useState<AddMenuErrors>({});
  const [saving, setSaving] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<MenuCategory>("ayam");
  const [editPrice, setEditPrice] = useState("");
  const [editTrackStock, setEditTrackStock] = useState(false);

  // Accessible Delete Menu Modal state
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter & Sort state
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<MenuSortOption>("default");
  const [searchQuery, setSearchQuery] = useState("");

  // Reorder & Drag-and-Drop state
  const [reordering, setReordering] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const categoryNameMap = Object.fromEntries(
    categories.map((c) => [c.slug, c.name])
  );

  function getCategoryLabel(slug: string): string {
    return categoryNameMap[slug] || CATEGORY_LABELS[slug] || slug;
  }

  const filteredAndSortedMenus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = menus.filter((m) => {
      if (filterCategory !== "all" && m.category !== filterCategory) {
        return false;
      }
      if (filterStatus === "active" && !m.isActive) return false;
      if (filterStatus === "inactive" && m.isActive) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });

    if (sortBy === "default") return list;

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name, "id");
        case "name_desc":
          return b.name.localeCompare(a.name, "id");
        case "price_asc":
          return a.price - b.price || a.name.localeCompare(b.name, "id");
        case "price_desc":
          return b.price - a.price || a.name.localeCompare(b.name, "id");
        case "stock_desc": {
          const aStock = a.trackStock ? a.stock : -1;
          const bStock = b.trackStock ? b.stock : -1;
          return bStock - aStock || a.name.localeCompare(b.name, "id");
        }
        default:
          return 0;
      }
    });
  }, [menus, filterCategory, filterStatus, sortBy, searchQuery]);

  const hasActiveFilter =
    filterCategory !== "all" ||
    filterStatus !== "all" ||
    sortBy !== "default" ||
    searchQuery.trim().length > 0;

  function resetFilters() {
    setFilterCategory("all");
    setFilterStatus("all");
    setSortBy("default");
    setSearchQuery("");
  }

  const canReorder = !hasActiveFilter && editingId === null && menus.length > 1;

  async function persistReorder(nextMenus: Menu[], previousMenus: Menu[]) {
    setMenus(nextMenus);
    setReordering(true);
    try {
      const res = await fetch("/api/menus/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: nextMenus.map((m) => m.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMenus(previousMenus);
        onNotify("error", data.error || "Gagal menyimpan urutan menu");
        return;
      }
      if (Array.isArray(data.menus)) {
        setMenus(data.menus);
      }
      onNotify("success", "Urutan kartu menu di kasir diperbarui");
    } catch {
      setMenus(previousMenus);
      onNotify("error", "Koneksi gagal saat menyimpan urutan menu");
    } finally {
      setReordering(false);
    }
  }

  function moveMenu(index: number, delta: -1 | 1) {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= menus.length || reordering) return;
    const prev = [...menus];
    const next = [...menus];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    persistReorder(next, prev);
  }

  function handleDropOnMenu(targetId: number) {
    if (draggingId === null || draggingId === targetId || reordering) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = menus.findIndex((m) => m.id === draggingId);
    const toIdx = menus.findIndex((m) => m.id === targetId);
    setDraggingId(null);
    setDragOverId(null);
    if (fromIdx === -1 || toIdx === -1) return;
    const prev = [...menus];
    const next = [...menus];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    persistReorder(next, prev);
  }

  async function reloadMenus() {
    try {
      const res = await fetch("/api/menus?includeInactive=true");
      if (!res.ok) {
        onNotify("error", "Gagal memuat daftar menu");
        return;
      }
      const data = await res.json();
      setMenus(data.menus);
    } catch {
      onNotify("error", "Koneksi gagal saat memuat daftar menu");
    }
  }

  async function reloadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories)) {
          onCategoriesChange(data.categories);
        }
      }
    } catch {
      // Keep current list on transient error
    }
  }

  // Always sync latest stock counts & categories when switching to Menu & Harga tab
  useEffect(() => {
    reloadMenus();
    reloadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError("Nama kategori wajib diisi.");
      return;
    }
    if (trimmed.length < 2) {
      setCategoryError("Nama kategori minimal 2 karakter.");
      return;
    }
    if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
      setCategoryError(
        `Nama kategori maksimal ${MAX_CATEGORY_NAME_LENGTH} karakter.`
      );
      return;
    }
    const normalizedSlug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!normalizedSlug) {
      setCategoryError("Nama kategori harus mengandung huruf atau angka.");
      return;
    }
    if (
      categories.some(
        (c) =>
          c.name.trim().toLowerCase() === trimmed.toLowerCase() ||
          c.slug.toLowerCase() === normalizedSlug
      )
    ) {
      setCategoryError(`Kategori "${trimmed}" sudah ada. Gunakan nama lain.`);
      return;
    }
    setCategoryError(null);
    setAddingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.error || "Gagal menambah kategori";
        setCategoryError(message);
        onNotify("error", message);
        return;
      }
      onNotify("success", `Kategori "${data.category.name}" ditambahkan`);
      setNewCategoryName("");
      setCategoryError(null);
      setNewCategory(data.category.slug);
      await reloadCategories();
    } catch {
      onNotify("error", "Koneksi gagal saat menambah kategori");
    } finally {
      setAddingCategory(false);
    }
  }

  async function confirmDeleteCategory() {
    if (!deleteCatTarget) return;
    setDeletingCategory(true);
    try {
      const res = await fetch(
        `/api/categories/${encodeURIComponent(deleteCatTarget.slug)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onNotify("error", data.error || "Gagal menghapus kategori");
        return;
      }
      onNotify("success", `Kategori "${deleteCatTarget.name}" dihapus`);
      setDeleteCatTarget(null);
      await reloadCategories();
    } catch {
      onNotify("error", "Koneksi gagal saat menghapus kategori");
    } finally {
      setDeletingCategory(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const errors: AddMenuErrors = {};
    const trimmedName = newName.trim();
    if (!trimmedName) {
      errors.name = "Nama menu wajib diisi.";
    } else if (trimmedName.length < 2) {
      errors.name = "Nama menu minimal 2 karakter.";
    } else if (trimmedName.length > MAX_MENU_NAME_LENGTH) {
      errors.name = `Nama menu maksimal ${MAX_MENU_NAME_LENGTH} karakter.`;
    } else if (
      menus.some(
        (m) => m.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      errors.name = `Menu "${trimmedName}" sudah ada. Gunakan nama lain.`;
    }

    const trimmedPrice = newPrice.trim();
    const parsedPrice = Number(trimmedPrice);
    if (!trimmedPrice) {
      errors.price = "Harga menu wajib diisi.";
    } else if (Number.isNaN(parsedPrice)) {
      errors.price = "Harga harus berupa angka yang valid.";
    } else if (parsedPrice < 0) {
      errors.price = "Harga tidak boleh kurang dari Rp 0.";
    } else if (parsedPrice > MAX_MENU_PRICE) {
      errors.price = "Harga maksimal Rp 9.999.999 (7 digit).";
    }

    if (newTrackStock) {
      const trimmedStock = newStock.trim();
      const parsedStock = Number(trimmedStock);
      if (!trimmedStock) {
        errors.stock = "Stok awal wajib diisi.";
      } else if (Number.isNaN(parsedStock) || !Number.isInteger(parsedStock)) {
        errors.stock = "Stok awal harus berupa bilangan bulat.";
      } else if (parsedStock < 0) {
        errors.stock = "Stok awal tidak boleh kurang dari 0.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    setAddErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          category: newCategory,
          price: parsedPrice,
          trackStock: newTrackStock,
          stock: newTrackStock ? Number(newStock) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Gagal menambah menu");
        return;
      }
      onNotify("success", `Menu "${data.menu.name}" ditambahkan`);
      setNewName("");
      setNewPrice("");
      setNewTrackStock(false);
      setNewStock("0");
      setAddErrors({});
      setShowAdd(false);
      await reloadMenus();
    } catch {
      onNotify("error", "Koneksi gagal saat menambah menu");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(menu: Menu) {
    setEditingId(menu.id);
    setEditName(menu.name);
    setEditCategory(menu.category);
    setEditPrice(String(menu.price));
    setEditTrackStock(menu.trackStock);
  }

  async function saveEdit(id: number) {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      onNotify("error", "Nama menu wajib diisi.");
      return;
    }
    if (trimmedName.length < 2) {
      onNotify("error", "Nama menu minimal 2 karakter.");
      return;
    }
    if (trimmedName.length > MAX_MENU_NAME_LENGTH) {
      onNotify("error", `Nama menu maksimal ${MAX_MENU_NAME_LENGTH} karakter.`);
      return;
    }
    if (
      menus.some(
        (m) =>
          m.id !== id &&
          m.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      onNotify(
        "error",
        `Menu "${trimmedName}" sudah ada. Gunakan nama lain.`
      );
      return;
    }
    const parsedPrice = Number(editPrice);
    if (editPrice.trim() === "" || Number.isNaN(parsedPrice)) {
      onNotify("error", "Harga menu wajib diisi dengan angka yang valid.");
      return;
    }
    if (parsedPrice < 0) {
      onNotify("error", "Harga tidak boleh kurang dari Rp 0.");
      return;
    }
    if (parsedPrice > MAX_MENU_PRICE) {
      onNotify("error", "Harga maksimal Rp 9.999.999 (7 digit).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/menus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          category: editCategory,
          price: parsedPrice,
          trackStock: editTrackStock,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Gagal mengubah menu");
        return;
      }
      onNotify("success", "Menu berhasil diperbarui");
      setEditingId(null);
      await reloadMenus();
    } catch {
      onNotify("error", "Koneksi gagal saat mengubah menu");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(menu: Menu) {
    try {
      const res = await fetch(`/api/menus/${menu.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !menu.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Gagal mengubah status menu");
        return;
      }
      onNotify(
        "success",
        menu.isActive
          ? `"${menu.name}" disembunyikan dari kasir`
          : `"${menu.name}" diaktifkan kembali`
      );
      await reloadMenus();
    } catch {
      onNotify("error", "Koneksi gagal saat mengubah status menu");
    }
  }

  async function confirmDeleteMenu() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/menus/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onNotify("error", data.error || "Gagal menghapus menu");
        return;
      }
      onNotify("success", `Menu "${deleteTarget.name}" berhasil dihapus`);
      setDeleteTarget(null);
      await reloadMenus();
    } catch {
      onNotify("error", "Koneksi gagal saat menghapus menu");
    } finally {
      setDeleting(false);
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent, id: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Custom Category Manager Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />
              <span>Kategori Menu</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Tambahkan kategori sendiri (misal: Paket Hemat, Sambal &amp; Lalapan, Lauk Tambahan).
            </p>
          </div>

          <form
            onSubmit={handleAddCategory}
            noValidate
            className="w-full sm:w-auto"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="new-category-name" className="sr-only">
                Nama kategori baru
              </label>
              <div className="relative flex-1 sm:w-56">
                <input
                  id="new-category-name"
                  type="text"
                  maxLength={MAX_CATEGORY_NAME_LENGTH}
                  aria-invalid={Boolean(categoryError)}
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (categoryError) setCategoryError(null);
                  }}
                  placeholder="Kategori baru..."
                  className={`w-full min-h-[40px] rounded-lg border bg-white pl-3 pr-12 py-2 text-sm text-slate-900 placeholder:text-slate-500 ${
                    categoryError ? "border-red-600" : "border-slate-300"
                  }`}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono tabular-nums text-slate-400"
                >
                  {newCategoryName.length}/{MAX_CATEGORY_NAME_LENGTH}
                </span>
              </div>
              <button
                type="submit"
                disabled={addingCategory}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
                  addingCategory
                    ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                }`}
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Tambah</span>
              </button>
            </div>
            {categoryError && (
              <p role="alert" className="text-xs font-medium text-red-700 mt-1">
                {categoryError}
              </p>
            )}
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const count = menus.filter((m) => m.category === cat.slug).length;
            const canDelete = count === 0 && categories.length > 1;
            return (
              <div
                key={cat.slug}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 whitespace-nowrap"
              >
                <span>{cat.name}</span>
                <span className="font-mono text-xs text-slate-600 tabular-nums">
                  ({count})
                </span>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteCatTarget(cat)}
                    aria-label={`Hapus kategori ${cat.name}`}
                    className="ml-0.5 p-0.5 rounded text-slate-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu Header & Add Button */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900 text-lg">
            Daftar Menu &amp; Harga
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Atur harga, aktifkan/sembunyikan menu di kasir, atau geser urutan kartu yang tampil di layar kasir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd((v) => !v);
            setAddErrors({});
          }}
          className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Tambah Menu</span>
        </button>
      </div>

      {/* Add Menu Form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          noValidate
          className="bg-white rounded-xl border border-blue-200 p-5 space-y-4"
        >
          <h3 className="font-bold text-sm text-slate-900">Tambah Menu Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="new-menu-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Nama Menu
                </label>
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  {newName.length}/{MAX_MENU_NAME_LENGTH}
                </span>
              </div>
              <input
                id="new-menu-name"
                type="text"
                maxLength={MAX_MENU_NAME_LENGTH}
                aria-invalid={Boolean(addErrors.name)}
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (addErrors.name) {
                    setAddErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                placeholder="Contoh: Tahu Bakar"
                className={`w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 ${
                  addErrors.name ? "border-red-600" : "border-slate-300"
                }`}
              />
              {addErrors.name && (
                <p role="alert" className="text-xs font-medium text-red-700 mt-1">
                  {addErrors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="new-menu-category"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Kategori
              </label>
              <select
                id="new-menu-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="new-menu-price"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Harga (Rp)
              </label>
              <input
                id="new-menu-price"
                type="number"
                min={0}
                max={MAX_MENU_PRICE}
                step={500}
                aria-invalid={Boolean(addErrors.price)}
                value={newPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!isWithinPriceDigitLimit(val)) return;
                  setNewPrice(val);
                  if (addErrors.price) {
                    setAddErrors((prev) => ({ ...prev, price: undefined }));
                  }
                }}
                placeholder="15000"
                className={`w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-500 tabular-nums ${
                  addErrors.price ? "border-red-600" : "border-slate-300"
                }`}
              />
              {addErrors.price && (
                <p role="alert" className="text-xs font-medium text-red-700 mt-1">
                  {addErrors.price}
                </p>
              )}
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1">
                Pelacakan Stok
              </span>
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="new-track-stock"
                  type="checkbox"
                  checked={newTrackStock}
                  onChange={(e) => {
                    setNewTrackStock(e.target.checked);
                    if (!e.target.checked && addErrors.stock) {
                      setAddErrors((prev) => ({ ...prev, stock: undefined }));
                    }
                  }}
                  className="w-4 h-4 accent-blue-700 rounded"
                />
                <label
                  htmlFor="new-track-stock"
                  className="text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  Hitung sisa stok
                </label>
              </div>
            </div>
          </div>

          {newTrackStock && (
            <div className="max-w-xs">
              <label
                htmlFor="new-menu-stock"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Stok Awal
              </label>
              <input
                id="new-menu-stock"
                type="number"
                min={0}
                aria-invalid={Boolean(addErrors.stock)}
                value={newStock}
                onChange={(e) => {
                  setNewStock(e.target.value);
                  if (addErrors.stock) {
                    setAddErrors((prev) => ({ ...prev, stock: undefined }));
                  }
                }}
                className={`w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm font-mono text-slate-900 tabular-nums ${
                  addErrors.stock ? "border-red-600" : "border-slate-300"
                }`}
              />
              {addErrors.stock && (
                <p role="alert" className="text-xs font-medium text-red-700 mt-1">
                  {addErrors.stock}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setAddErrors({});
              }}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition ${
                saving
                  ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800 text-white cursor-pointer"
              }`}
            >
              {saving ? "Menyimpan..." : "Simpan Menu"}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Sort Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="menus-filter-category" className="sr-only">
            Filter kategori menu
          </label>
          <select
            id="menus-filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="min-h-[38px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          <label htmlFor="menus-filter-status" className="sr-only">
            Filter status menu
          </label>
          <select
            id="menus-filter-status"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "active" | "inactive")
            }
            className="min-h-[38px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          <label htmlFor="menus-sort-by" className="sr-only">
            Urutkan menu
          </label>
          <select
            id="menus-sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MenuSortOption)}
            className="min-h-[38px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white"
          >
            <option value="default">Urutkan: Default</option>
            <option value="name_asc">Nama: A → Z</option>
            <option value="name_desc">Nama: Z → A</option>
            <option value="price_asc">Harga: Termurah</option>
            <option value="price_desc">Harga: Termahal</option>
            <option value="stock_desc">Stok: Terbanyak</option>
          </select>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition cursor-pointer whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>

        <div className="relative w-full lg:w-60">
          <Search
            className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="menus-search" className="sr-only">
            Cari nama menu
          </label>
          <input
            id="menus-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama menu..."
            className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Hapus pencarian menu"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Menu List — Mobile First Cards (< md) + Crisp Desktop Table (>= md) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {hasActiveFilter && filteredAndSortedMenus.length > 0 && (
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span>
              Mode filter/urut aktif — reset ke <strong>Default</strong> untuk mengubah urutan kartu di kasir.
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="font-semibold text-blue-700 hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
        {filteredAndSortedMenus.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Tidak ada menu yang cocok dengan filter ini
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-slate-200">
              {filteredAndSortedMenus.map((menu, idx) => {
            const isEditing = editingId === menu.id;
            return (
              <div key={menu.id} className="p-4 space-y-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor={`mob-edit-name-${menu.id}`}
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Nama Menu
                      </label>
                      <input
                        id={`mob-edit-name-${menu.id}`}
                        type="text"
                        maxLength={MAX_MENU_NAME_LENGTH}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, menu.id)}
                        className="w-full min-h-[40px] rounded-lg border border-blue-700 px-3 py-1.5 text-sm font-semibold text-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label
                          htmlFor={`mob-edit-cat-${menu.id}`}
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Kategori
                        </label>
                        <select
                          id={`mob-edit-cat-${menu.id}`}
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full min-h-[40px] rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-900"
                        >
                          {categories.map((cat) => (
                            <option key={cat.slug} value={cat.slug}>
                              {cat.name}
                            </option>
                          ))}
                          {!categoryNameMap[editCategory] && (
                            <option value={editCategory}>
                              {getCategoryLabel(editCategory)}
                            </option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor={`mob-edit-price-${menu.id}`}
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Harga (Rp)
                        </label>
                        <input
                          id={`mob-edit-price-${menu.id}`}
                          type="number"
                          min={0}
                          max={MAX_MENU_PRICE}
                          step={500}
                          value={editPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!isWithinPriceDigitLimit(val)) return;
                            setEditPrice(val);
                          }}
                          onKeyDown={(e) => handleEditKeyDown(e, menu.id)}
                          className="w-full min-h-[40px] rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={editTrackStock}
                        onChange={(e) => setEditTrackStock(e.target.checked)}
                        className="w-4 h-4 accent-blue-700"
                      />
                      <span>Lacak sisa stok</span>
                    </label>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => saveEdit(menu.id)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-bold"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className={`font-bold text-sm break-words [overflow-wrap:anywhere] ${
                            menu.isActive
                              ? "text-slate-900"
                              : "text-slate-500 line-through"
                          }`}
                        >
                          {menu.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                            {getCategoryLabel(menu.category)}
                          </span>
                          {menu.trackStock ? (
                            <span className="inline-flex items-center text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 whitespace-nowrap">
                              Stok: {menu.stock} ptg
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">
                              Tanpa lacak stok
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-base text-slate-900 tabular-nums shrink-0">
                        {formatRupiah(menu.price)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={menu.isActive}
                        onClick={() => toggleActive(menu)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        <span
                          className={`w-9 h-5 rounded-full p-0.5 transition flex items-center ${
                            menu.isActive
                              ? "bg-emerald-700 justify-end"
                              : "bg-slate-300 justify-start"
                          }`}
                          aria-hidden="true"
                        >
                          <span className="w-4 h-4 rounded-full bg-white block" />
                        </span>
                        <span>
                          {menu.isActive ? "Aktif di Kasir" : "Disembunyikan"}
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {canReorder && (
                          <>
                            <button
                              type="button"
                              disabled={idx === 0 || reordering}
                              onClick={() => moveMenu(idx, -1)}
                              aria-label={`Geser ${menu.name} ke atas`}
                              className={`min-h-[38px] min-w-[34px] flex items-center justify-center rounded-lg border text-xs transition ${
                                idx === 0 || reordering
                                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 cursor-pointer"
                              }`}
                            >
                              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              disabled={
                                idx === filteredAndSortedMenus.length - 1 ||
                                reordering
                              }
                              onClick={() => moveMenu(idx, 1)}
                              aria-label={`Geser ${menu.name} ke bawah`}
                              className={`min-h-[38px] min-w-[34px] flex items-center justify-center rounded-lg border text-xs transition ${
                                idx === filteredAndSortedMenus.length - 1 ||
                                reordering
                                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 cursor-pointer"
                              }`}
                            >
                              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(menu)}
                          aria-label={`Edit menu ${menu.name}`}
                          className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold cursor-pointer whitespace-nowrap"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(menu)}
                          aria-label={`Hapus menu ${menu.name}`}
                          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-slate-300 bg-white text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">
                {canReorder && (
                  <th className="pl-4 pr-2 py-3 w-24">Urutan</th>
                )}
                <th className="px-5 py-3">Nama Menu</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3 text-right">Harga</th>
                <th className="px-5 py-3 text-center">Lacak Stok</th>
                <th className="px-5 py-3 text-center">Tampil di Kasir</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAndSortedMenus.map((menu, idx) => {
                const isEditing = editingId === menu.id;
                const isDragging = draggingId === menu.id;
                const isDragOver = dragOverId === menu.id && draggingId !== menu.id;
                return (
                  <tr
                    key={menu.id}
                    draggable={canReorder}
                    onDragStart={() => setDraggingId(menu.id)}
                    onDragOver={(e) => {
                      if (!canReorder) return;
                      e.preventDefault();
                      setDragOverId(menu.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverId === menu.id) setDragOverId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnMenu(menu.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverId(null);
                    }}
                    className={`transition ${
                      isDragging
                        ? "opacity-50 bg-blue-50"
                        : isDragOver
                        ? "bg-blue-50/70 outline-2 outline-blue-700 -outline-offset-2"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {canReorder && (
                      <td className="pl-4 pr-2 py-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span
                            title="Tarik untuk memindahkan urutan"
                            className="p-1 text-slate-500 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-4 h-4" aria-hidden="true" />
                          </span>
                          <button
                            type="button"
                            disabled={idx === 0 || reordering}
                            onClick={() => moveMenu(idx, -1)}
                            aria-label={`Geser ${menu.name} ke atas`}
                            className={`w-7 h-7 rounded-md border flex items-center justify-center transition ${
                              idx === 0 || reordering
                                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                            }`}
                          >
                            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            disabled={
                              idx === filteredAndSortedMenus.length - 1 ||
                              reordering
                            }
                            onClick={() => moveMenu(idx, 1)}
                            aria-label={`Geser ${menu.name} ke bawah`}
                            className={`w-7 h-7 rounded-md border flex items-center justify-center transition ${
                              idx === filteredAndSortedMenus.length - 1 ||
                              reordering
                                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                            }`}
                          >
                            <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3.5 max-w-[260px]">
                      {isEditing ? (
                        <input
                          type="text"
                          aria-label="Edit nama menu"
                          maxLength={MAX_MENU_NAME_LENGTH}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, menu.id)}
                          className="w-full rounded-lg border border-blue-700 px-2.5 py-1.5 text-sm font-semibold text-slate-900"
                        />
                      ) : (
                        <span
                          className={`block font-semibold break-words [overflow-wrap:anywhere] ${
                            menu.isActive
                              ? "text-slate-900"
                              : "text-slate-500 line-through"
                          }`}
                        >
                          {menu.name}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <select
                          aria-label="Edit kategori menu"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="rounded-lg border border-blue-700 px-2.5 py-1.5 text-xs bg-white text-slate-900"
                        >
                          {categories.map((cat) => (
                            <option key={cat.slug} value={cat.slug}>
                              {cat.name}
                            </option>
                          ))}
                          {!categoryNameMap[editCategory] && (
                            <option value={editCategory}>
                              {getCategoryLabel(editCategory)}
                            </option>
                          )}
                        </select>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                          {getCategoryLabel(menu.category)}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          aria-label="Edit harga menu"
                          min={0}
                          max={MAX_MENU_PRICE}
                          step={500}
                          value={editPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!isWithinPriceDigitLimit(val)) return;
                            setEditPrice(val);
                          }}
                          onKeyDown={(e) => handleEditKeyDown(e, menu.id)}
                          className="w-28 rounded-lg border border-blue-700 px-2.5 py-1.5 text-sm font-bold text-right text-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900">
                          {formatRupiah(menu.price)}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          aria-label="Lacak sisa stok"
                          checked={editTrackStock}
                          onChange={(e) => setEditTrackStock(e.target.checked)}
                          className="w-4 h-4 accent-blue-700"
                        />
                      ) : menu.trackStock ? (
                        <span className="inline-flex items-center text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 whitespace-nowrap">
                          Ya ({menu.stock})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">Tidak</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={menu.isActive}
                        aria-label={`${
                          menu.isActive ? "Nonaktifkan" : "Aktifkan"
                        } menu ${menu.name}`}
                        onClick={() => toggleActive(menu)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer whitespace-nowrap"
                      >
                        <span
                          className={`w-9 h-5 rounded-full p-0.5 transition flex items-center ${
                            menu.isActive
                              ? "bg-emerald-700 justify-end"
                              : "bg-slate-300 justify-start"
                          }`}
                          aria-hidden="true"
                        >
                          <span className="w-4 h-4 rounded-full bg-white block" />
                        </span>
                        <span>{menu.isActive ? "Aktif" : "Nonaktif"}</span>
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => saveEdit(menu.id)}
                              aria-label="Simpan perubahan menu"
                              className="w-9 h-9 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              aria-label="Batalkan edit menu"
                              className="w-9 h-9 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(menu)}
                              aria-label={`Edit menu ${menu.name}`}
                              className="w-9 h-9 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 flex items-center justify-center cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(menu)}
                              aria-label={`Hapus menu ${menu.name}`}
                              className="w-9 h-9 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>

      {/* Delete Menu Confirmation Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteTarget ? `Hapus menu "${deleteTarget.name}"?` : ""}
        description="Menu akan dihapus permanen dari daftar menu & kasir. Riwayat transaksi, struk, dan laporan penjualan sebelumnya tetap aman dan tidak terhapus."
        confirmLabel="Ya, Hapus Menu"
        tone="danger"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteMenu}
      />

      {/* Delete Category Confirmation Modal */}
      <ConfirmModal
        open={deleteCatTarget !== null}
        title={
          deleteCatTarget ? `Hapus kategori "${deleteCatTarget.name}"?` : ""
        }
        description="Kategori yang belum dipakai menu apa pun dapat dihapus kapan saja dan bisa ditambahkan kembali nanti."
        confirmLabel="Ya, Hapus Kategori"
        tone="danger"
        loading={deletingCategory}
        onClose={() => setDeleteCatTarget(null)}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
}
