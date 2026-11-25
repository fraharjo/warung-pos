import fs from "fs/promises";
import path from "path";
import { hashPassword } from "../auth";
import { AppError } from "../errors";
import { getWIBDateRange, slugifyCategory, toWIBDateKey } from "../format";
import type {
  AdjustStockInput,
  CategoryItem,
  CreateMenuInput,
  CreateOrderInput,
  CreateUserInput,
  Menu,
  MenuSalesSummary,
  Order,
  OrderItem,
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
import type { DatabaseAdapter } from "./interface";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_MENUS,
  DEFAULT_STORE_SETTINGS,
} from "./seed";

interface LocalStoreData {
  counters: {
    users: number;
    menus: number;
    orders: number;
    orderItems: number;
    stockLogs: number;
  };
  categories?: CategoryItem[];
  users: UserRecord[];
  menus: Menu[];
  orders: Order[];
  stockLogs: StockLog[];
  settings: StoreSettings;
}

const DATA_DIR = path.join(process.cwd(), ".local-data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

function stripPassword(user: UserRecord): User {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function buildInitialData(): LocalStoreData {
  const now = new Date().toISOString();
  const users: UserRecord[] = [
    {
      id: 1,
      username: "admin",
      name: "Admin Utama",
      role: "admin",
      passwordHash: hashPassword("admin123"),
      createdAt: now,
    },
    {
      id: 2,
      username: "kasir",
      name: "Kasir 1",
      role: "kasir",
      passwordHash: hashPassword("kasir123"),
      createdAt: now,
    },
  ];

  const menus: Menu[] = DEFAULT_MENUS.map((m, idx) => ({
    id: idx + 1,
    name: m.name,
    category: m.category,
    price: m.price,
    trackStock: m.trackStock,
    stock: m.stock,
    isActive: true,
    sortOrder: m.sortOrder,
    createdAt: now,
  }));

  const stockLogs: StockLog[] = menus
    .filter((m) => m.trackStock && m.stock > 0)
    .map((m, idx) => ({
      id: idx + 1,
      menuId: m.id,
      menuName: m.name,
      changeAmount: m.stock,
      stockAfter: m.stock,
      reason: "restock",
      note: "Stok awal sistem",
      createdByName: "Sistem",
      createdAt: now,
    }));

  return {
    counters: {
      users: users.length,
      menus: menus.length,
      orders: 0,
      orderItems: 0,
      stockLogs: stockLogs.length,
    },
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    users,
    menus,
    orders: [],
    stockLogs,
    settings: { ...DEFAULT_STORE_SETTINGS },
  };
}

export class LocalJsonDatabase implements DatabaseAdapter {
  readonly adapterVersion = 6;
  private writeQueue: Promise<unknown> = Promise.resolve();

  private async readData(): Promise<LocalStoreData> {
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8");
      return JSON.parse(raw) as LocalStoreData;
    } catch {
      const initial = buildInitialData();
      await this.writeData(initial);
      return initial;
    }
  }

  private async writeData(data: LocalStoreData): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmpFile = `${DATA_FILE}.${Date.now()}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmpFile, DATA_FILE);
  }

  private withLock<T>(fn: (data: LocalStoreData) => Promise<T> | T): Promise<T> {
    const next = this.writeQueue.then(async () => {
      const data = await this.readData();
      const result = await fn(data);
      await this.writeData(data);
      return result;
    });
    this.writeQueue = next.catch(() => {});
    return next;
  }

  async findUserByUsername(username: string): Promise<UserRecord | null> {
    const data = await this.readData();
    const normalized = username.trim().toLowerCase();
    return data.users.find((u) => u.username.toLowerCase() === normalized) ?? null;
  }

  async listUsers(): Promise<User[]> {
    const data = await this.readData();
    return data.users.map(stripPassword);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    return this.withLock((data) => {
      const username = input.username.trim().toLowerCase();
      if (!username || username.length < 3) {
        throw new AppError("Username minimal 3 karakter", 400);
      }
      if (!input.name.trim()) {
        throw new AppError("Nama lengkap wajib diisi", 400);
      }
      if (!input.password || input.password.length < 4) {
        throw new AppError("Password minimal 4 karakter", 400);
      }
      if (data.users.some((u) => u.username.toLowerCase() === username)) {
        throw new AppError("Username sudah digunakan", 409);
      }
      const user: UserRecord = {
        id: ++data.counters.users,
        username,
        name: input.name.trim(),
        role: input.role,
        passwordHash: hashPassword(input.password),
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      return stripPassword(user);
    });
  }

  async updateUser(
    id: number,
    input: UpdateUserInput,
    actorId: number
  ): Promise<User> {
    return this.withLock((data) => {
      const user = data.users.find((u) => u.id === id);
      if (!user) throw new AppError("Pengguna tidak ditemukan", 404);

      if (input.role && input.role !== "admin" && user.role === "admin") {
        const adminCount = data.users.filter((u) => u.role === "admin").length;
        if (adminCount <= 1) {
          throw new AppError("Minimal harus ada 1 akun Admin aktif", 400);
        }
        if (user.id === actorId) {
          throw new AppError("Tidak dapat menurunkan role akun sendiri", 400);
        }
      }

      if (input.name !== undefined && input.name.trim()) {
        user.name = input.name.trim();
      }
      if (input.role !== undefined) {
        user.role = input.role;
      }
      if (input.password !== undefined && input.password.length > 0) {
        if (input.password.length < 4) {
          throw new AppError("Password minimal 4 karakter", 400);
        }
        user.passwordHash = hashPassword(input.password);
      }

      return stripPassword(user);
    });
  }

  async deleteUser(id: number, actorId: number): Promise<void> {
    return this.withLock((data) => {
      if (id === actorId) {
        throw new AppError("Tidak dapat menghapus akun yang sedang dipakai", 400);
      }
      const idx = data.users.findIndex((u) => u.id === id);
      if (idx === -1) throw new AppError("Pengguna tidak ditemukan", 404);
      if (data.users[idx].role === "admin") {
        const adminCount = data.users.filter((u) => u.role === "admin").length;
        if (adminCount <= 1) {
          throw new AppError("Minimal harus ada 1 akun Admin", 400);
        }
      }
      data.users.splice(idx, 1);
    });
  }

  private ensureCategories(data: LocalStoreData): CategoryItem[] {
    if (!Array.isArray(data.categories) || data.categories.length === 0) {
      data.categories = DEFAULT_CATEGORIES.map((c) => ({ ...c }));
    }
    return data.categories;
  }

  async listCategories(): Promise<CategoryItem[]> {
    const data = await this.readData();
    const categories = this.ensureCategories(data);
    return [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async createCategory(rawName: string): Promise<CategoryItem> {
    return this.withLock((data) => {
      const name = rawName.trim();
      if (!name || name.length < 2) {
        throw new AppError("Nama kategori minimal 2 karakter", 400);
      }
      if (name.length > 30) {
        throw new AppError("Nama kategori maksimal 30 karakter", 400);
      }
      const slug = slugifyCategory(name);
      if (!slug) {
        throw new AppError("Nama kategori harus mengandung huruf atau angka", 400);
      }
      const categories = this.ensureCategories(data);
      if (
        categories.some(
          (c) =>
            c.slug.toLowerCase() === slug ||
            c.name.toLowerCase() === name.toLowerCase()
        )
      ) {
        throw new AppError(`Kategori "${name}" sudah ada`, 409);
      }
      const maxOrder = categories.reduce(
        (max, c) => Math.max(max, c.sortOrder),
        0
      );
      const item: CategoryItem = {
        slug,
        name,
        sortOrder: maxOrder + 1,
      };
      categories.push(item);
      return { ...item };
    });
  }

  async deleteCategory(slug: string): Promise<void> {
    return this.withLock((data) => {
      const categories = this.ensureCategories(data);
      const idx = categories.findIndex((c) => c.slug === slug);
      if (idx === -1) {
        throw new AppError("Kategori tidak ditemukan", 404);
      }
      if (categories.length <= 1) {
        throw new AppError("Minimal harus ada 1 kategori aktif", 400);
      }
      const usedCount = data.menus.filter((m) => m.category === slug).length;
      if (usedCount > 0) {
        throw new AppError(
          `Kategori masih dipakai oleh ${usedCount} menu. Ubah kategori menu tersebut terlebih dahulu.`,
          400
        );
      }
      categories.splice(idx, 1);
    });
  }

  async listMenus(includeInactive = false): Promise<Menu[]> {
    const data = await this.readData();
    return data.menus
      .filter((m) => includeInactive || m.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  async createMenu(input: CreateMenuInput, actor: SessionUser): Promise<Menu> {
    return this.withLock((data) => {
      const name = input.name.trim();
      if (!name || name.length < 2) {
        throw new AppError("Nama menu minimal 2 karakter", 400);
      }
      if (name.length > 50) {
        throw new AppError("Nama menu maksimal 50 karakter", 400);
      }
      if (
        data.menus.some(
          (m) => m.name.trim().toLowerCase() === name.toLowerCase()
        )
      ) {
        throw new AppError(`Menu "${name}" sudah ada`, 409);
      }
      if (input.price < 0 || !Number.isFinite(input.price)) {
        throw new AppError("Harga tidak valid", 400);
      }
      if (input.price > 9_999_999) {
        throw new AppError("Harga maksimal Rp 9.999.999 (7 digit)", 400);
      }
      const initialStock = input.trackStock ? Math.max(0, Math.floor(input.stock ?? 0)) : 0;
      const now = new Date().toISOString();
      const menu: Menu = {
        id: ++data.counters.menus,
        name,
        category: input.category,
        price: Math.round(input.price),
        trackStock: Boolean(input.trackStock),
        stock: initialStock,
        isActive: true,
        sortOrder: input.sortOrder ?? data.menus.length + 1,
        createdAt: now,
      };
      data.menus.push(menu);

      if (menu.trackStock && initialStock > 0) {
        data.stockLogs.push({
          id: ++data.counters.stockLogs,
          menuId: menu.id,
          menuName: menu.name,
          changeAmount: initialStock,
          stockAfter: initialStock,
          reason: "restock",
          note: "Stok awal menu baru",
          createdByName: actor.name,
          createdAt: now,
        });
      }

      return menu;
    });
  }

  async updateMenu(id: number, input: UpdateMenuInput): Promise<Menu> {
    return this.withLock((data) => {
      const menu = data.menus.find((m) => m.id === id);
      if (!menu) throw new AppError("Menu tidak ditemukan", 404);

      if (input.name !== undefined) {
        const trimmed = input.name.trim();
        if (!trimmed || trimmed.length < 2) {
          throw new AppError("Nama menu minimal 2 karakter", 400);
        }
        if (trimmed.length > 50) {
          throw new AppError("Nama menu maksimal 50 karakter", 400);
        }
        if (
          data.menus.some(
            (m) =>
              m.id !== id && m.name.trim().toLowerCase() === trimmed.toLowerCase()
          )
        ) {
          throw new AppError(`Menu "${trimmed}" sudah ada`, 409);
        }
        menu.name = trimmed;
      }
      if (input.category !== undefined) menu.category = input.category;
      if (input.price !== undefined) {
        if (input.price < 0 || !Number.isFinite(input.price)) {
          throw new AppError("Harga tidak valid", 400);
        }
        if (input.price > 9_999_999) {
          throw new AppError("Harga maksimal Rp 9.999.999 (7 digit)", 400);
        }
        menu.price = Math.round(input.price);
      }
      if (input.trackStock !== undefined) menu.trackStock = Boolean(input.trackStock);
      if (input.isActive !== undefined) menu.isActive = Boolean(input.isActive);
      if (input.sortOrder !== undefined) menu.sortOrder = input.sortOrder;

      return { ...menu };
    });
  }

  async deleteMenu(id: number): Promise<void> {
    return this.withLock((data) => {
      const menu = data.menus.find((m) => m.id === id);
      if (!menu) throw new AppError("Menu tidak ditemukan", 404);
      data.menus = data.menus.filter((m) => m.id !== id);
    });
  }

  async reorderMenus(orderedIds: number[]): Promise<void> {
    return this.withLock((data) => {
      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        throw new AppError("Urutan menu tidak valid", 400);
      }
      const rank = new Map<number, number>();
      orderedIds.forEach((id, idx) => rank.set(Number(id), idx + 1));
      let fallback = orderedIds.length + 1;
      for (const menu of data.menus) {
        const nextOrder = rank.get(menu.id);
        menu.sortOrder = nextOrder !== undefined ? nextOrder : fallback++;
      }
    });
  }

  async adjustStock(input: AdjustStockInput, actor: SessionUser): Promise<Menu> {
    const results = await this.adjustStockBatch([input], actor);
    return results[0];
  }

  async adjustStockBatch(
    inputs: AdjustStockInput[],
    actor: SessionUser
  ): Promise<Menu[]> {
    return this.withLock((data) => {
      if (!inputs.length) throw new AppError("Daftar penyesuaian stok kosong", 400);

      // Validate all first
      for (const item of inputs) {
        const menu = data.menus.find((m) => m.id === item.menuId);
        if (!menu) throw new AppError("Menu tidak ditemukan", 404);
        if (!menu.trackStock) {
          throw new AppError(`Menu "${menu.name}" tidak menggunakan pelacakan stok`, 400);
        }
        const delta = Math.trunc(item.changeAmount);
        if (delta === 0) {
          throw new AppError("Jumlah perubahan stok tidak boleh 0", 400);
        }
        if (menu.stock + delta < 0) {
          throw new AppError(
            `Stok "${menu.name}" tidak cukup untuk dikurangi (sisa ${menu.stock})`,
            400
          );
        }
      }

      const now = new Date().toISOString();
      const updated: Menu[] = [];

      for (const item of inputs) {
        const menu = data.menus.find((m) => m.id === item.menuId)!;
        const delta = Math.trunc(item.changeAmount);
        menu.stock += delta;
        data.stockLogs.push({
          id: ++data.counters.stockLogs,
          menuId: menu.id,
          menuName: menu.name,
          changeAmount: delta,
          stockAfter: menu.stock,
          reason: item.reason,
          note: item.note?.trim() || (item.reason === "restock" ? "Tambah stok" : "Penyesuaian stok"),
          createdByName: actor.name,
          createdAt: now,
        });
        updated.push({ ...menu });
      }

      return updated;
    });
  }

  async listStockLogs(limit = 50): Promise<StockLog[]> {
    const data = await this.readData();
    return [...data.stockLogs]
      .sort((a, b) => b.id - a.id)
      .slice(0, limit);
  }

  async createOrder(input: CreateOrderInput, actor: SessionUser): Promise<Order> {
    return this.withLock((data) => {
      if (!input.items || input.items.length === 0) {
        throw new AppError("Pesanan minimal harus memiliki 1 menu", 400);
      }

      // Merge duplicate menuIds
      const merged = new Map<number, number>();
      for (const item of input.items) {
        const qty = Math.trunc(item.quantity);
        if (qty <= 0) throw new AppError("Jumlah item harus lebih dari 0", 400);
        merged.set(item.menuId, (merged.get(item.menuId) ?? 0) + qty);
      }

      const resolvedItems: Array<{ menu: Menu; qty: number }> = [];
      let totalAmount = 0;

      for (const [menuId, qty] of merged.entries()) {
        const menu = data.menus.find((m) => m.id === menuId && m.isActive);
        if (!menu) {
          throw new AppError("Salah satu menu tidak ditemukan atau nonaktif", 400);
        }
        if (menu.trackStock && menu.stock < qty) {
          throw new AppError(
            `Stok ${menu.name} tidak mencukupi (tersisa ${menu.stock})`,
            400
          );
        }
        resolvedItems.push({ menu, qty });
        totalAmount += menu.price * qty;
      }

      const amountPaid =
        input.paymentMethod === "qris"
          ? totalAmount
          : Math.round(input.amountPaid);

      if (amountPaid < totalAmount) {
        throw new AppError("Uang yang dibayarkan kurang dari total pesanan", 400);
      }

      const now = new Date().toISOString();
      const dateKey = toWIBDateKey(now);
      const compactDate = dateKey.replace(/-/g, "").slice(2); // YYMMDD
      const todayCount = data.orders.filter(
        (o) => toWIBDateKey(o.createdAt) === dateKey
      ).length;
      const orderNumber = `ORD-${compactDate}-${String(todayCount + 1).padStart(3, "0")}`;

      const orderId = ++data.counters.orders;
      const orderItems: OrderItem[] = resolvedItems.map(({ menu, qty }) => ({
        id: ++data.counters.orderItems,
        orderId,
        menuId: menu.id,
        menuName: menu.name,
        category: menu.category,
        price: menu.price,
        quantity: qty,
        subtotal: menu.price * qty,
      }));

      // Deduct stock & log
      for (const { menu, qty } of resolvedItems) {
        if (menu.trackStock) {
          menu.stock -= qty;
          data.stockLogs.push({
            id: ++data.counters.stockLogs,
            menuId: menu.id,
            menuName: menu.name,
            changeAmount: -qty,
            stockAfter: menu.stock,
            reason: "sale",
            note: `Order ${orderNumber}`,
            createdByName: actor.name,
            createdAt: now,
          });
        }
      }

      const order: Order = {
        id: orderId,
        orderNumber,
        customerName: input.customerName?.trim() || "Pelanggan Umum",
        cashierId: actor.userId,
        cashierName: actor.name,
        totalAmount,
        paymentMethod: input.paymentMethod,
        amountPaid,
        changeAmount: amountPaid - totalAmount,
        status: "completed",
        notes: input.notes?.trim() || "",
        cancelReason: null,
        cancelledByName: null,
        cancelledAt: null,
        createdAt: now,
        items: orderItems,
      };

      data.orders.push(order);
      return order;
    });
  }

  async listOrders(filters?: {
    dateFrom?: string;
    dateTo?: string;
    status?: OrderStatus | "all";
    limit?: number;
  }): Promise<Order[]> {
    const data = await this.readData();
    let result = [...data.orders];

    if (filters?.dateFrom && filters?.dateTo) {
      const { startIso, endIso } = getWIBDateRange(filters.dateFrom, filters.dateTo);
      const startMs = new Date(startIso).getTime();
      const endMs = new Date(endIso).getTime();
      result = result.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= startMs && t <= endMs;
      });
    }

    if (filters?.status && filters.status !== "all") {
      result = result.filter((o) => o.status === filters.status);
    }

    result.sort((a, b) => b.id - a.id);

    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  async getOrderById(id: number): Promise<Order | null> {
    const data = await this.readData();
    return data.orders.find((o) => o.id === id) ?? null;
  }

  async cancelOrder(
    id: number,
    reason: string,
    actor: SessionUser
  ): Promise<Order> {
    return this.withLock((data) => {
      const order = data.orders.find((o) => o.id === id);
      if (!order) throw new AppError("Pesanan tidak ditemukan", 404);
      if (order.status === "cancelled") {
        throw new AppError("Pesanan ini sudah dibatalkan sebelumnya", 400);
      }

      const now = new Date().toISOString();
      order.status = "cancelled";
      order.cancelReason = reason.trim() || "Dibatalkan oleh Admin";
      order.cancelledByName = actor.name;
      order.cancelledAt = now;

      // Return stock for stock-tracked menus
      for (const item of order.items) {
        const menu = data.menus.find((m) => m.id === item.menuId);
        if (menu && menu.trackStock) {
          menu.stock += item.quantity;
          data.stockLogs.push({
            id: ++data.counters.stockLogs,
            menuId: menu.id,
            menuName: menu.name,
            changeAmount: item.quantity,
            stockAfter: menu.stock,
            reason: "cancel",
            note: `Batal ${order.orderNumber}: ${order.cancelReason}`,
            createdByName: actor.name,
            createdAt: now,
          });
        }
      }

      return { ...order };
    });
  }

  async getSalesReport(dateFrom: string, dateTo: string): Promise<SalesReport> {
    const data = await this.readData();
    const { startIso, endIso } = getWIBDateRange(dateFrom, dateTo);
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();

    const rangeOrders = data.orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= startMs && t <= endMs;
    });

    const completed = rangeOrders.filter((o) => o.status === "completed");
    const cancelledOrders = rangeOrders.filter((o) => o.status === "cancelled").length;

    let totalRevenue = 0;
    let cashRevenue = 0;
    let qrisRevenue = 0;
    let cashOrders = 0;
    let qrisOrders = 0;

    const menuMap = new Map<number, MenuSalesSummary>();
    for (const m of data.menus) {
      if (m.isActive) {
        menuMap.set(m.id, {
          menuId: m.id,
          menuName: m.name,
          category: m.category,
          trackStock: m.trackStock,
          currentStock: m.stock,
          quantitySold: 0,
          totalRevenue: 0,
        });
      }
    }

    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    for (const order of completed) {
      totalRevenue += order.totalAmount;
      if (order.paymentMethod === "cash") {
        cashRevenue += order.totalAmount;
        cashOrders += 1;
      } else {
        qrisRevenue += order.totalAmount;
        qrisOrders += 1;
      }

      const dayKey = toWIBDateKey(order.createdAt);
      const dayEntry = dailyMap.get(dayKey) ?? { revenue: 0, orders: 0 };
      dayEntry.revenue += order.totalAmount;
      dayEntry.orders += 1;
      dailyMap.set(dayKey, dayEntry);

      for (const item of order.items) {
        const existing = menuMap.get(item.menuId);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.totalRevenue += item.subtotal;
        } else {
          const menuRef = data.menus.find((m) => m.id === item.menuId);
          menuMap.set(item.menuId, {
            menuId: item.menuId,
            menuName: item.menuName,
            category: item.category,
            trackStock: menuRef?.trackStock ?? false,
            currentStock: menuRef?.stock ?? 0,
            quantitySold: item.quantity,
            totalRevenue: item.subtotal,
          });
        }
      }
    }

    const catOrderMap = new Map(
      this.ensureCategories(data).map((c) => [c.slug, c.sortOrder])
    );
    const menuSales = Array.from(menuMap.values()).sort((a, b) => {
      const catDiff =
        (catOrderMap.get(a.category) ?? 999) -
        (catOrderMap.get(b.category) ?? 999);
      if (catDiff !== 0) return catDiff;
      return b.quantitySold - a.quantitySold || a.menuId - b.menuId;
    });

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, val]) => ({ date, revenue: val.revenue, orders: val.orders }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      dateFrom,
      dateTo,
      totalRevenue,
      totalOrders: completed.length,
      cancelledOrders,
      cashRevenue,
      qrisRevenue,
      cashOrders,
      qrisOrders,
      menuSales,
      dailyBreakdown,
    };
  }

  async getSettings(): Promise<StoreSettings> {
    const data = await this.readData();
    return {
      ...data.settings,
      storeLogo: data.settings.storeLogo ?? "",
    };
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    return this.withLock((data) => {
      if (
        settings.storeLogo !== undefined &&
        settings.storeLogo.length > 500_000
      ) {
        throw new AppError("Ukuran file logo terlalu besar (maks. 500KB)", 400);
      }
      data.settings = {
        storeName: settings.storeName?.trim() || data.settings.storeName,
        storeAddress:
          settings.storeAddress !== undefined
            ? settings.storeAddress.trim()
            : data.settings.storeAddress,
        storePhone:
          settings.storePhone !== undefined
            ? settings.storePhone.trim()
            : data.settings.storePhone,
        receiptFooter:
          settings.receiptFooter !== undefined
            ? settings.receiptFooter.trim()
            : data.settings.receiptFooter,
        storeLogo:
          settings.storeLogo !== undefined
            ? settings.storeLogo
            : data.settings.storeLogo ?? "",
      };
      return { ...data.settings };
    });
  }
}
