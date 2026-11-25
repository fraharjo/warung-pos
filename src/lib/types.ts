export type UserRole = "admin" | "kasir";

export type MenuCategory = string;

export interface CategoryItem {
  slug: string;
  name: string;
  sortOrder: number;
}

export type PaymentMethod = "cash" | "qris";

export type OrderStatus = "completed" | "cancelled";

export type StockLogReason = "restock" | "sale" | "cancel" | "adjustment";

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface UserRecord extends User {
  passwordHash: string;
}

export interface SessionUser {
  userId: number;
  username: string;
  name: string;
  role: UserRole;
}

export interface Menu {
  id: number;
  name: string;
  category: MenuCategory;
  price: number;
  trackStock: boolean;
  stock: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuId: number;
  menuName: string;
  category: MenuCategory;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  cashierId: number;
  cashierName: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  status: OrderStatus;
  notes: string;
  cancelReason: string | null;
  cancelledByName: string | null;
  cancelledAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface StockLog {
  id: number;
  menuId: number;
  menuName: string;
  changeAmount: number;
  stockAfter: number;
  reason: StockLogReason;
  note: string;
  createdByName: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
  storeLogo: string;
}

export interface MenuSalesSummary {
  menuId: number;
  menuName: string;
  category: MenuCategory;
  trackStock: boolean;
  currentStock: number;
  quantitySold: number;
  totalRevenue: number;
}

export interface DailySalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface SalesReport {
  dateFrom: string;
  dateTo: string;
  totalRevenue: number;
  totalOrders: number;
  cancelledOrders: number;
  cashRevenue: number;
  qrisRevenue: number;
  cashOrders: number;
  qrisOrders: number;
  menuSales: MenuSalesSummary[];
  dailyBreakdown: DailySalesPoint[];
}

export interface CreateOrderInput {
  customerName?: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  notes?: string;
  items: Array<{
    menuId: number;
    quantity: number;
  }>;
}

export interface CreateMenuInput {
  name: string;
  category: MenuCategory;
  price: number;
  trackStock: boolean;
  stock?: number;
  sortOrder?: number;
}

export interface UpdateMenuInput {
  name?: string;
  category?: MenuCategory;
  price?: number;
  trackStock?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface AdjustStockInput {
  menuId: number;
  changeAmount: number;
  reason: "restock" | "adjustment";
  note?: string;
}

export interface CreateUserInput {
  username: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  role?: UserRole;
}
