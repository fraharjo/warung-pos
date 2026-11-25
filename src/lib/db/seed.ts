import type { CategoryItem, MenuCategory, StoreSettings } from "../types";

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { slug: "ayam", name: "Ayam Bakar", sortOrder: 1 },
  { slug: "nasi", name: "Nasi", sortOrder: 2 },
  { slug: "minuman", name: "Minuman", sortOrder: 3 },
  { slug: "lainnya", name: "Lainnya", sortOrder: 4 },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "Ayam Bakar Spesial",
  storeAddress: "Jl. Kuliner Nusantara No. 12",
  storePhone: "0812-3456-7890",
  receiptFooter: "Terima kasih atas pesanannya! Selamat menikmati.",
  storeLogo: "",
};

export const DEFAULT_MENUS: Array<{
  name: string;
  category: MenuCategory;
  price: number;
  trackStock: boolean;
  stock: number;
  sortOrder: number;
}> = [
  {
    name: "Ayam Bakar (Paha)",
    category: "ayam",
    price: 15000,
    trackStock: true,
    stock: 20,
    sortOrder: 1,
  },
  {
    name: "Ayam Bakar (Dada)",
    category: "ayam",
    price: 16000,
    trackStock: true,
    stock: 20,
    sortOrder: 2,
  },
  {
    name: "Nasi Putih",
    category: "nasi",
    price: 5000,
    trackStock: false,
    stock: 0,
    sortOrder: 3,
  },
  {
    name: "Nasi Uduk",
    category: "nasi",
    price: 7000,
    trackStock: false,
    stock: 0,
    sortOrder: 4,
  },
  {
    name: "Es Teh Manis",
    category: "minuman",
    price: 5000,
    trackStock: false,
    stock: 0,
    sortOrder: 5,
  },
  {
    name: "Teh Tawar",
    category: "minuman",
    price: 3000,
    trackStock: false,
    stock: 0,
    sortOrder: 6,
  },
];
