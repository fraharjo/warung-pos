"use client";

import { useState } from "react";
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const SHOW_DEMO_ACCOUNTS =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true";

interface LoginFormProps {
  storeName: string;
  storeLogo?: string;
}

export function LoginForm({ storeName, storeLogo }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Username atau password tidak sesuai");
        setLoading(false);
        return;
      }
      const target = data.user.role === "admin" ? "/admin" : "/pos";
      window.location.assign(target);
    } catch {
      setError("Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.");
      setLoading(false);
    }
  }

  function fillDemo(role: "kasir" | "admin") {
    setError("");
    if (role === "kasir") {
      setUsername("kasir");
      setPassword("kasir123");
    } else {
      setUsername("admin");
      setPassword("admin123");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 p-7 sm:p-8">
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-200">
            <BrandLogo logoUrl={storeLogo} storeName={storeName} size="md" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight truncate">
                {storeName}
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Masuk ke sistem Kasir POS &amp; Stok
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-800"
            >
              <AlertCircle
                className="w-4 h-4 shrink-0 mt-0.5 text-red-700"
                aria-hidden="true"
              />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 min-h-[46px] flex items-center justify-center gap-2 rounded-lg font-semibold py-3 px-4 text-sm transition ${
                loading
                  ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white cursor-pointer"
              }`}
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {SHOW_DEMO_ACCOUNTS && (
            <details className="mt-6 pt-5 border-t border-slate-200 group">
              <summary className="list-none flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                <span>Akses akun demo lokal</span>
                <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
              </summary>
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => fillDemo("kasir")}
                  className="rounded-lg border border-slate-200 hover:border-blue-700 hover:bg-blue-50 px-3 py-2.5 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900">Kasir</div>
                  <div className="text-xs font-mono text-slate-600 mt-0.5">
                    kasir / kasir123
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("admin")}
                  className="rounded-lg border border-slate-200 hover:border-blue-700 hover:bg-blue-50 px-3 py-2.5 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900">Admin</div>
                  <div className="text-xs font-mono text-slate-600 mt-0.5">
                    admin / admin123
                  </div>
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
    </main>
  );
}
