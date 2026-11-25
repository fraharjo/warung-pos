import type {
  AdjustStockInput,
  CategoryItem,
  CreateMenuInput,
  CreateOrderInput,
  CreateUserInput,
  Menu,
  Order,
  OrderStatus,
  SalesReport,
  SessionUser,
  StockLog,
  StoreSettings,
  UpdateMenuInput,
  UpdateUserInput,
  User,
  UserRecord,
} from "../types";

export interface DatabaseAdapter {
  // Users & Auth
  findUserByUsername(username: string): Promise<UserRecord | null>;
  listUsers(): Promise<User[]>;
  createUser(input: CreateUserInput): Promise<User>;
  updateUser(id: number, input: UpdateUserInput, actorId: number): Promise<User>;
  deleteUser(id: number, actorId: number): Promise<void>;

  // Categories
  listCategories(): Promise<CategoryItem[]>;
  createCategory(name: string): Promise<CategoryItem>;
  deleteCategory(slug: string): Promise<void>;

  // Menus
  listMenus(includeInactive?: boolean): Promise<Menu[]>;
  createMenu(input: CreateMenuInput, actor: SessionUser): Promise<Menu>;
  updateMenu(id: number, input: UpdateMenuInput): Promise<Menu>;
  deleteMenu(id: number): Promise<void>;
  reorderMenus(orderedIds: number[]): Promise<void>;

  // Stock
  adjustStock(input: AdjustStockInput, actor: SessionUser): Promise<Menu>;
  adjustStockBatch(inputs: AdjustStockInput[], actor: SessionUser): Promise<Menu[]>;
  listStockLogs(limit?: number): Promise<StockLog[]>;

  // Orders
  createOrder(input: CreateOrderInput, actor: SessionUser): Promise<Order>;
  listOrders(filters?: {
    dateFrom?: string;
    dateTo?: string;
    status?: OrderStatus | "all";
    limit?: number;
  }): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | null>;
  cancelOrder(id: number, reason: string, actor: SessionUser): Promise<Order>;

  // Reports & Settings
  getSalesReport(dateFrom: string, dateTo: string): Promise<SalesReport>;
  getSettings(): Promise<StoreSettings>;
  updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings>;
}
