"use client";

import { Flame } from "lucide-react";

interface BrandLogoProps {
  logoUrl?: string;
  storeName: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({
  logoUrl,
  storeName,
  size = "sm",
}: BrandLogoProps) {
  const sizeClass =
    size === "lg"
      ? "w-14 h-14 rounded-xl"
      : size === "md"
      ? "w-10 h-10 rounded-lg"
      : "w-9 h-9 rounded-lg";

  const iconClass =
    size === "lg" ? "w-7 h-7" : size === "md" ? "w-5 h-5" : "w-5 h-5";

  if (logoUrl) {
    return (
      <div
        className={`${sizeClass} border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={`Logo ${storeName}`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} bg-slate-900 flex items-center justify-center shrink-0`}
    >
      <Flame className={`${iconClass} text-white`} aria-hidden="true" />
    </div>
  );
}
