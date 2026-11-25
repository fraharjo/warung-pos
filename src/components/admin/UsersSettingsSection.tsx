"use client";

import { useRef, useState } from "react";
import {
  UserPlus,
  Trash2,
  KeyRound,
  Store,
  Save,
  ChevronDown,
  Upload,
  X,
} from "lucide-react";
import type { StoreSettings, User, UserRole } from "@/lib/types";
import { ConfirmModal } from "../ConfirmModal";
import { BrandLogo } from "../BrandLogo";

async function resizeImageToDataUrl(file: File): Promise<string> {
  if (file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Gagal membaca file SVG"));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 192;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Browser tidak mendukung pemrosesan gambar"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("File gambar tidak valid"));
    };
    img.src = objectUrl;
  });
}

interface UsersSettingsSectionProps {
  currentUserId: number;
  initialUsers: User[];
  initialSettings: StoreSettings;
  dbMode: "postgres" | "local";
  onSettingsUpdated: (settings: StoreSettings) => void;
  onNotify: (type: "success" | "error", message: string) => void;
}

export function UsersSettingsSection({
  currentUserId,
  initialUsers,
  initialSettings,
  dbMode,
  onSettingsUpdated,
  onNotify,
}: UsersSettingsSectionProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);

  // Add user form (collapsible for progressive disclosure, matching MenusSection)
  const [showAddUser, setShowAddUser] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("kasir");
  const [addingUser, setAddingUser] = useState(false);

  // Reset password inline
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Accessible Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Settings saving
  const [savingSettings, setSavingSettings] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onNotify("error", "Pilih file gambar (PNG, JPG, WebP, atau SVG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onNotify("error", "Ukuran file gambar maksimal 5MB");
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setSettings((prev) => ({ ...prev, storeLogo: dataUrl }));
    } catch (err) {
      onNotify(
        "error",
        err instanceof Error ? err.message : "Gagal memproses gambar logo"
      );
    }
  }

  async function reloadUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
      onNotify("error", "Gagal memuat daftar pengguna");
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Gagal menambah akun");
        return;
      }
      onNotify("success", `Akun "${data.user.username}" berhasil dibuat`);
      setUsername("");
      setName("");
      setPassword("");
      setRole("kasir");
      setShowAddUser(false);
      await reloadUsers();
    } catch {
      onNotify("error", "Koneksi gagal saat membuat akun");
    } finally {
      setAddingUser(false);
    }
  }

  async function handleResetPassword(id: number) {
    if (newPassword.length < 4) {
      onNotify("error", "Password baru minimal 4 karakter");
      return;
    }
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Gagal ganti password");
        return;
      }
      onNotify("success", "Password berhasil diperbarui");
      setResetUserId(null);
      setNewPassword("");
    } catch {
      onNotify("error", "Koneksi gagal saat mengganti password");
    }
  }

  async function confirmDeleteUser() {
    if (!deleteTarget) return;
    setDeletingUser(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onNotify("error", data.error || "Gagal menghapus akun");
        return;
      }
      onNotify("success", `Akun "${deleteTarget.username}" dihapus`);
      setDeleteTarget(null);
      await reloadUsers();
    } catch {
      onNotify("error", "Koneksi gagal saat menghapus akun");
    } finally {
      setDeletingUser(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Gagal menyimpan pengaturan");
        return;
      }
      setSettings(data.settings);
      onSettingsUpdated(data.settings);
      if (data.settings?.storeName) {
        document.title = `${data.settings.storeName} — Kasir POS & Stok`;
      }
      onNotify("success", "Pengaturan berhasil disimpan");
    } catch {
      onNotify("error", "Koneksi gagal saat menyimpan pengaturan");
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* LEFT: User Management */}
      <section className="lg:col-span-7 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                Akun Kasir &amp; Admin
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Kelola akses login staf kasir dan pemilik.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddUser((v) => !v)}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Tambah Akun</span>
            </button>
          </div>

          {showAddUser && (
            <form
              onSubmit={handleAddUser}
              className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div>
                <label
                  htmlFor="add-user-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Nama Lengkap
                </label>
                <input
                  id="add-user-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi (Kasir Sore)"
                  className="w-full min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="add-user-username"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Username
                </label>
                <input
                  id="add-user-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kasir2"
                  className="w-full min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="add-user-password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="add-user-password"
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="add-user-role"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Role
                </label>
                <select
                  id="add-user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-700"
                >
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    addingUser
                      ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                      : "bg-blue-700 hover:bg-blue-800 text-white cursor-pointer"
                  }`}
                >
                  {addingUser ? "Menyimpan..." : "Buat Akun"}
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="divide-y divide-slate-200">
            {users.map((u) => (
              <div key={u.id} className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {u.name}
                      </span>
                      <span
                        className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md uppercase whitespace-nowrap ${
                          u.role === "admin"
                            ? "bg-slate-900 text-white"
                            : "bg-blue-100 text-blue-900"
                        }`}
                      >
                        {u.role}
                      </span>
                      {u.id === currentUserId && (
                        <span className="text-xs text-emerald-800 font-semibold">
                          (Anda)
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-600 mt-0.5">
                      @{u.username}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setResetUserId(resetUserId === u.id ? null : u.id);
                        setNewPassword("");
                      }}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <KeyRound className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Password</span>
                    </button>

                    {u.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(u)}
                        aria-label={`Hapus akun ${u.username}`}
                        className="w-9 h-9 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {resetUserId === u.id && (
                  <div className="flex items-center gap-2 pt-1">
                    <label htmlFor={`reset-pw-${u.id}`} className="sr-only">
                      Password baru untuk {u.username}
                    </label>
                    <input
                      id={`reset-pw-${u.id}`}
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Password baru (min. 4 karakter)"
                      className="flex-1 min-h-[38px] rounded-lg border border-blue-700 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleResetPassword(u.id)}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Simpan
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RIGHT: Store Settings & Quiet System Details */}
      <section className="lg:col-span-5 space-y-4">
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-slate-800" aria-hidden="true" />
            <h2 className="font-bold text-slate-900 text-base">General</h2>
          </div>

          <div className="space-y-3.5">
            {/* Brand Logo Upload */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                Logo (tampil di pojok kiri atas &amp; halaman login)
              </span>
              <div className="flex items-center gap-3.5">
                <BrandLogo
                  logoUrl={settings.storeLogo}
                  storeName={settings.storeName}
                  size="lg"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={logoInputRef}
                    id="setting-store-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 transition cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {settings.storeLogo ? "Ganti Logo" : "Upload Logo"}
                    </span>
                  </button>
                  {settings.storeLogo && (
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({ ...prev, storeLogo: "" }))
                      }
                      className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-800 transition cursor-pointer whitespace-nowrap"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Format PNG, JPG, WebP, atau SVG. Klik <strong>Simpan Pengaturan</strong> setelah mengganti logo.
              </p>
            </div>

            <div>
              <label
                htmlFor="setting-store-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nama Usaha
              </label>
              <input
                id="setting-store-name"
                type="text"
                required
                value={settings.storeName}
                onChange={(e) =>
                  setSettings({ ...settings, storeName: e.target.value })
                }
                className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="setting-store-address"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Alamat (tampil di struk)
              </label>
              <input
                id="setting-store-address"
                type="text"
                value={settings.storeAddress}
                onChange={(e) =>
                  setSettings({ ...settings, storeAddress: e.target.value })
                }
                className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="setting-store-phone"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                No. WhatsApp / Telepon
              </label>
              <input
                id="setting-store-phone"
                type="text"
                value={settings.storePhone}
                onChange={(e) =>
                  setSettings({ ...settings, storePhone: e.target.value })
                }
                className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="setting-receipt-footer"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Pesan Bawah Struk
              </label>
              <textarea
                id="setting-receipt-footer"
                rows={2}
                value={settings.receiptFooter}
                onChange={(e) =>
                  setSettings({ ...settings, receiptFooter: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-600 text-white text-sm font-semibold cursor-pointer"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>
              {savingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
            </span>
          </button>
        </form>

        {/* Quiet Collapsible System Storage Info (no developer jargon dominating owner UI) */}
        <details className="bg-white rounded-xl border border-slate-200 p-4 group">
          <summary className="list-none flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <span>
              Penyimpanan Data:{" "}
              <strong className="text-slate-900">
                {dbMode === "postgres" ? "Cloud Aktif" : "Lokal Perangkat"}
              </strong>
            </span>
            <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>
          <p className="text-xs text-slate-600 leading-relaxed mt-2.5 pt-2.5 border-t border-slate-200">
            {dbMode === "postgres"
              ? "Data tersimpan aman di database cloud (PostgreSQL melalui DATABASE_URL) dan siap diakses dari banyak perangkat."
              : "Data tersimpan otomatis secara lokal di .local-data/db.json. Untuk sinkronisasi antar perangkat saat online, hubungkan DATABASE_URL di server deployment."}
          </p>
        </details>
      </section>

      {/* Consistent Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteTarget ? `Hapus akun "${deleteTarget.username}"?` : ""}
        description={
          deleteTarget
            ? `Akun ${deleteTarget.name} (@${deleteTarget.username}) tidak lagi bisa masuk ke aplikasi kasir.`
            : ""
        }
        confirmLabel="Ya, Hapus Akun"
        tone="danger"
        loading={deletingUser}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}
