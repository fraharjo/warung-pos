export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTimeWIB(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatTimeWIB(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDateShortID(yyyyMmDd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd);
  if (!match) return yyyyMmDd;
  const date = new Date(`${yyyyMmDd}T12:00:00+07:00`);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getTodayWIB(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getDaysAgoWIB(days: number): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getWIBDateRange(dateFrom: string, dateTo: string): {
  startIso: string;
  endIso: string;
} {
  return {
    startIso: new Date(`${dateFrom}T00:00:00+07:00`).toISOString(),
    endIso: new Date(`${dateTo}T23:59:59.999+07:00`).toISOString(),
  };
}

export function toWIBDateKey(isoString: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoString));
}

export const CATEGORY_LABELS: Record<string, string> = {
  makanan: "Makanan",
  nasi: "Nasi",
  minuman: "Minuman",
  snack: "Camilan",
  lainnya: "Lainnya",
};

export function slugifyCategory(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const REASON_LABELS: Record<string, string> = {
  restock: "Restock",
  sale: "Penjualan",
  cancel: "Batal Order",
  adjustment: "Penyesuaian",
};
