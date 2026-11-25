import { Pool, type PoolClient } from "pg";
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
  MenuCategory,
  MenuSalesSummary,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  SalesReport,
  SessionUser,
  StockLog,
  StockLogReason,
  StoreSettings,
  UpdateMenuInput,
  UpdateUserInput,
  User,
  UserRecord,
  UserRole,
} from "../types";
import type { DatabaseAdapter } from "./interface";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_MENUS,
  DEFAULT_STORE_SETTINGS,
} from "./seed";

function isLocalPostgres(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

function mapMenuRow(row: Record<string, unknown>): Menu {
  return {
    id: Number(row.id),
    name: String(row.name),
    category: String(row.category) as MenuCategory,
    price: Number(row.price),
    trackStock: Boolean(row.track_stock),
    stock: Number(row.stock),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapUserRow(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    username: String(row.username),
    name: String(row.name),
    role: String(row.role) as UserRole,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export class PostgresDatabase implements DatabaseAdapter {
  readonly adapterVersion = 6;
  private pool: Pool;
  private initPromise: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: isLocalPostgres(connectionString)
        ? false
        : { rejectUnauthorized: false },
      max: 5,
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initializeSchema().catch((err) => {
        this.initPromise = null;
        throw err;
      });
    }
    await this.initPromise;
  }

  private async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'kasir')),
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS categories (
          slug TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS menus (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price INTEGER NOT NULL CHECK (price >= 0),
          track_stock BOOLEAN NOT NULL DEFAULT FALSE,
          stock INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_category_check;

        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          order_number TEXT UNIQUE NOT NULL,
          customer_name TEXT NOT NULL DEFAULT 'Pelanggan Umum',
          cashier_id INTEGER NOT NULL,
          cashier_name TEXT NOT NULL,
          total_amount INTEGER NOT NULL,
          payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qris')),
          amount_paid INTEGER NOT NULL,
          change_amount INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
          notes TEXT NOT NULL DEFAULT '',
          cancel_reason TEXT,
          cancelled_by_name TEXT,
          cancelled_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          menu_id INTEGER NOT NULL,
          menu_name TEXT NOT NULL,
          category TEXT NOT NULL,
          price INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          subtotal INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stock_logs (
          id SERIAL PRIMARY KEY,
          menu_id INTEGER NOT NULL,
          menu_name TEXT NOT NULL,
          change_amount INTEGER NOT NULL,
          stock_after INTEGER NOT NULL,
          reason TEXT NOT NULL CHECK (reason IN ('restock', 'sale', 'cancel', 'adjustment')),
          note TEXT NOT NULL DEFAULT '',
          created_by_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS store_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          store_name TEXT NOT NULL,
          store_address TEXT NOT NULL DEFAULT '',
          store_phone TEXT NOT NULL DEFAULT '',
          receipt_footer TEXT NOT NULL DEFAULT '',
          store_logo TEXT NOT NULL DEFAULT ''
        );

        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_logo TEXT NOT NULL DEFAULT '';

        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at ON stock_logs(created_at DESC);
      `);

      // Seed default categories if empty
      const catCount = await client.query("SELECT COUNT(*)::int AS count FROM categories");
      if (Number(catCount.rows[0].count) === 0) {
        for (const c of DEFAULT_CATEGORIES) {
          await client.query(
            `INSERT INTO categories (slug, name, sort_order)
             VALUES ($1, $2, $3)
             ON CONFLICT (slug) DO NOTHING`,
            [c.slug, c.name, c.sortOrder]
          );
        }
      }

      // Seed default users if empty
      const userCount = await client.query("SELECT COUNT(*)::int AS count FROM users");
      if (Number(userCount.rows[0].count) === 0) {
        await client.query(
          `INSERT INTO users (username, name, role, password_hash)
           VALUES ($1, $2, 'admin', $3), ($4, $5, 'kasir', $6)
           ON CONFLICT (username) DO NOTHING`,
          [
            "admin",
            "Admin Utama",
            hashPassword("admin123"),
            "kasir",
            "Kasir 1",
            hashPassword("kasir123"),
          ]
        );
      }

      // Seed default menus if empty
      const menuCount = await client.query("SELECT COUNT(*)::int AS count FROM menus");
      if (Number(menuCount.rows[0].count) === 0) {
        for (const m of DEFAULT_MENUS) {
          const inserted = await client.query(
            `INSERT INTO menus (name, category, price, track_stock, stock, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [m.name, m.category, m.price, m.trackStock, m.stock, m.sortOrder]
          );
          if (m.trackStock && m.stock > 0) {
            await client.query(
              `INSERT INTO stock_logs (menu_id, menu_name, change_amount, stock_after, reason, note, created_by_name)
               VALUES ($1, $2, $3, $4, 'restock', 'Stok awal sistem', 'Sistem')`,
              [inserted.rows[0].id, m.name, m.stock, m.stock]
            );
          }
        }
      }

      // Seed default settings if empty
      await client.query(
        `INSERT INTO store_settings (id, store_name, store_address, store_phone, receipt_footer)
         VALUES (1, $1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [
          DEFAULT_STORE_SETTINGS.storeName,
          DEFAULT_STORE_SETTINGS.storeAddress,
          DEFAULT_STORE_SETTINGS.storePhone,
          DEFAULT_STORE_SETTINGS.receiptFooter,
        ]
      );
    } finally {
      client.release();
    }
  }

  private async withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    await this.ensureInitialized();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async findUserByUsername(username: string): Promise<UserRecord | null> {
    await this.ensureInitialized();
    const res = await this.pool.query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
      [username.trim()]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...mapUserRow(row),
      passwordHash: String(row.password_hash),
    };
  }

  async listUsers(): Promise<User[]> {
    await this.ensureInitialized();
    const res = await this.pool.query("SELECT * FROM users ORDER BY id ASC");
    return res.rows.map(mapUserRow);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    await this.ensureInitialized();
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
    try {
      const res = await this.pool.query(
        `INSERT INTO users (username, name, role, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [username, input.name.trim(), input.role, hashPassword(input.password)]
      );
      return mapUserRow(res.rows[0]);
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === "23505") {
        throw new AppError("Username sudah digunakan", 409);
      }
      throw err;
    }
  }

  async updateUser(
    id: number,
    input: UpdateUserInput,
    actorId: number
  ): Promise<User> {
    return this.withTx(async (client) => {
      const found = await client.query("SELECT * FROM users WHERE id = $1 FOR UPDATE", [id]);
      if (found.rows.length === 0) {
        throw new AppError("Pengguna tidak ditemukan", 404);
      }
      const user = found.rows[0];

      if (input.role && input.role !== "admin" && user.role === "admin") {
        const admins = await client.query(
          "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'"
        );
        if (Number(admins.rows[0].count) <= 1) {
          throw new AppError("Minimal harus ada 1 akun Admin aktif", 400);
        }
        if (id === actorId) {
          throw new AppError("Tidak dapat menurunkan role akun sendiri", 400);
        }
      }

      const nextName = input.name?.trim() || String(user.name);
      const nextRole = input.role ?? String(user.role);
      let nextHash = String(user.password_hash);
      if (input.password && input.password.length > 0) {
        if (input.password.length < 4) {
          throw new AppError("Password minimal 4 karakter", 400);
        }
        nextHash = hashPassword(input.password);
      }

      const updated = await client.query(
        `UPDATE users SET name = $1, role = $2, password_hash = $3 WHERE id = $4 RETURNING *`,
        [nextName, nextRole, nextHash, id]
      );
      return mapUserRow(updated.rows[0]);
    });
  }

  async deleteUser(id: number, actorId: number): Promise<void> {
    return this.withTx(async (client) => {
      if (id === actorId) {
        throw new AppError("Tidak dapat menghapus akun yang sedang dipakai", 400);
      }
      const found = await client.query("SELECT * FROM users WHERE id = $1 FOR UPDATE", [id]);
      if (found.rows.length === 0) {
        throw new AppError("Pengguna tidak ditemukan", 404);
      }
      if (found.rows[0].role === "admin") {
        const admins = await client.query(
          "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'"
        );
        if (Number(admins.rows[0].count) <= 1) {
          throw new AppError("Minimal harus ada 1 akun Admin", 400);
        }
      }
      await client.query("DELETE FROM users WHERE id = $1", [id]);
    });
  }

  async listCategories(): Promise<CategoryItem[]> {
    await this.ensureInitialized();
    const res = await this.pool.query(
      "SELECT slug, name, sort_order FROM categories ORDER BY sort_order ASC, slug ASC"
    );
    return res.rows.map((r) => ({
      slug: String(r.slug),
      name: String(r.name),
      sortOrder: Number(r.sort_order),
    }));
  }

  async createCategory(rawName: string): Promise<CategoryItem> {
    await this.ensureInitialized();
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
    const existing = await this.pool.query(
      "SELECT 1 FROM categories WHERE LOWER(slug) = LOWER($1) OR LOWER(name) = LOWER($2) LIMIT 1",
      [slug, name]
    );
    if (existing.rows.length > 0) {
      throw new AppError(`Kategori "${name}" sudah ada`, 409);
    }
    const maxRes = await this.pool.query(
      "SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM categories"
    );
    const sortOrder = Number(maxRes.rows[0].max_order) + 1;
    await this.pool.query(
      "INSERT INTO categories (slug, name, sort_order) VALUES ($1, $2, $3)",
      [slug, name, sortOrder]
    );
    return { slug, name, sortOrder };
  }

  async deleteCategory(slug: string): Promise<void> {
    await this.ensureInitialized();
    const found = await this.pool.query(
      "SELECT slug FROM categories WHERE slug = $1",
      [slug]
    );
    if (found.rows.length === 0) {
      throw new AppError("Kategori tidak ditemukan", 404);
    }
    const total = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM categories"
    );
    if (Number(total.rows[0].count) <= 1) {
      throw new AppError("Minimal harus ada 1 kategori aktif", 400);
    }
    const used = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM menus WHERE category = $1",
      [slug]
    );
    const usedCount = Number(used.rows[0].count);
    if (usedCount > 0) {
      throw new AppError(
        `Kategori masih dipakai oleh ${usedCount} menu. Ubah kategori menu tersebut terlebih dahulu.`,
        400
      );
    }
    await this.pool.query("DELETE FROM categories WHERE slug = $1", [slug]);
  }

  async listMenus(includeInactive = false): Promise<Menu[]> {
    await this.ensureInitialized();
    const sql = includeInactive
      ? "SELECT * FROM menus ORDER BY sort_order ASC, id ASC"
      : "SELECT * FROM menus WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC";
    const res = await this.pool.query(sql);
    return res.rows.map(mapMenuRow);
  }

  async createMenu(input: CreateMenuInput, actor: SessionUser): Promise<Menu> {
    return this.withTx(async (client) => {
      const name = input.name.trim();
      if (!name || name.length < 2) {
        throw new AppError("Nama menu minimal 2 karakter", 400);
      }
      if (name.length > 50) {
        throw new AppError("Nama menu maksimal 50 karakter", 400);
      }
      const dup = await client.query(
        "SELECT id FROM menus WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1",
        [name]
      );
      if (dup.rows.length > 0) {
        throw new AppError(`Menu "${name}" sudah ada`, 409);
      }
      if (input.price < 0 || !Number.isFinite(input.price)) {
        throw new AppError("Harga tidak valid", 400);
      }
      if (input.price > 9_999_999) {
        throw new AppError("Harga maksimal Rp 9.999.999 (7 digit)", 400);
      }
      const initialStock = input.trackStock
        ? Math.max(0, Math.floor(input.stock ?? 0))
        : 0;
      const countRes = await client.query("SELECT COUNT(*)::int AS count FROM menus");
      const sortOrder = input.sortOrder ?? Number(countRes.rows[0].count) + 1;

      const res = await client.query(
        `INSERT INTO menus (name, category, price, track_stock, stock, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, input.category, Math.round(input.price), Boolean(input.trackStock), initialStock, sortOrder]
      );
      const menu = mapMenuRow(res.rows[0]);

      if (menu.trackStock && initialStock > 0) {
        await client.query(
          `INSERT INTO stock_logs (menu_id, menu_name, change_amount, stock_after, reason, note, created_by_name)
           VALUES ($1, $2, $3, $4, 'restock', 'Stok awal menu baru', $5)`,
          [menu.id, menu.name, initialStock, initialStock, actor.name]
        );
      }

      return menu;
    });
  }

  async updateMenu(id: number, input: UpdateMenuInput): Promise<Menu> {
    return this.withTx(async (client) => {
      const found = await client.query("SELECT * FROM menus WHERE id = $1 FOR UPDATE", [id]);
      if (found.rows.length === 0) throw new AppError("Menu tidak ditemukan", 404);
      const cur = mapMenuRow(found.rows[0]);

      const nextName =
        input.name !== undefined ? input.name.trim() : cur.name;
      if (!nextName || nextName.length < 2) {
        throw new AppError("Nama menu minimal 2 karakter", 400);
      }
      if (nextName.length > 50) {
        throw new AppError("Nama menu maksimal 50 karakter", 400);
      }
      if (input.name !== undefined) {
        const dup = await client.query(
          "SELECT id FROM menus WHERE LOWER(TRIM(name)) = LOWER($1) AND id <> $2 LIMIT 1",
          [nextName, id]
        );
        if (dup.rows.length > 0) {
          throw new AppError(`Menu "${nextName}" sudah ada`, 409);
        }
      }

      const nextPrice =
        input.price !== undefined ? Math.round(input.price) : cur.price;
      if (nextPrice < 0 || !Number.isFinite(nextPrice)) {
        throw new AppError("Harga tidak valid", 400);
      }
      if (nextPrice > 9_999_999) {
        throw new AppError("Harga maksimal Rp 9.999.999 (7 digit)", 400);
      }

      const res = await client.query(
        `UPDATE menus
         SET name = $1, category = $2, price = $3, track_stock = $4, is_active = $5, sort_order = $6
         WHERE id = $7 RETURNING *`,
        [
          nextName,
          input.category ?? cur.category,
          nextPrice,
          input.trackStock ?? cur.trackStock,
          input.isActive ?? cur.isActive,
          input.sortOrder ?? cur.sortOrder,
          id,
        ]
      );
      return mapMenuRow(res.rows[0]);
    });
  }

  async deleteMenu(id: number): Promise<void> {
    return this.withTx(async (client) => {
      const found = await client.query("SELECT id FROM menus WHERE id = $1", [id]);
      if (found.rows.length === 0) throw new AppError("Menu tidak ditemukan", 404);
      await client.query("DELETE FROM menus WHERE id = $1", [id]);
    });
  }

  async reorderMenus(orderedIds: number[]): Promise<void> {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new AppError("Urutan menu tidak valid", 400);
    }
    return this.withTx(async (client) => {
      for (let idx = 0; idx < orderedIds.length; idx++) {
        const id = Number(orderedIds[idx]);
        if (!Number.isInteger(id) || id <= 0) continue;
        await client.query("UPDATE menus SET sort_order = $1 WHERE id = $2", [
          idx + 1,
          id,
        ]);
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
    if (!inputs.length) throw new AppError("Daftar penyesuaian stok kosong", 400);
    return this.withTx(async (client) => {
      const updatedMenus: Menu[] = [];
      for (const item of inputs) {
        const res = await client.query(
          "SELECT * FROM menus WHERE id = $1 FOR UPDATE",
          [item.menuId]
        );
        if (res.rows.length === 0) throw new AppError("Menu tidak ditemukan", 404);
        const menu = mapMenuRow(res.rows[0]);
        if (!menu.trackStock) {
          throw new AppError(`Menu "${menu.name}" tidak menggunakan pelacakan stok`, 400);
        }
        const delta = Math.trunc(item.changeAmount);
        if (delta === 0) {
          throw new AppError("Jumlah perubahan stok tidak boleh 0", 400);
        }
        const nextStock = menu.stock + delta;
        if (nextStock < 0) {
          throw new AppError(
            `Stok "${menu.name}" tidak cukup untuk dikurangi (sisa ${menu.stock})`,
            400
          );
        }

        const updated = await client.query(
          "UPDATE menus SET stock = $1 WHERE id = $2 RETURNING *",
          [nextStock, menu.id]
        );
        await client.query(
          `INSERT INTO stock_logs (menu_id, menu_name, change_amount, stock_after, reason, note, created_by_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            menu.id,
            menu.name,
            delta,
            nextStock,
            item.reason,
            item.note?.trim() || (item.reason === "restock" ? "Tambah stok" : "Penyesuaian stok"),
            actor.name,
          ]
        );
        updatedMenus.push(mapMenuRow(updated.rows[0]));
      }
      return updatedMenus;
    });
  }

  async listStockLogs(limit = 50): Promise<StockLog[]> {
    await this.ensureInitialized();
    const res = await this.pool.query(
      "SELECT * FROM stock_logs ORDER BY id DESC LIMIT $1",
      [limit]
    );
    return res.rows.map((r) => ({
      id: Number(r.id),
      menuId: Number(r.menu_id),
      menuName: String(r.menu_name),
      changeAmount: Number(r.change_amount),
      stockAfter: Number(r.stock_after),
      reason: String(r.reason) as StockLogReason,
      note: String(r.note),
      createdByName: String(r.created_by_name),
      createdAt: new Date(String(r.created_at)).toISOString(),
    }));
  }

  async createOrder(input: CreateOrderInput, actor: SessionUser): Promise<Order> {
    if (!input.items || input.items.length === 0) {
      throw new AppError("Pesanan minimal harus memiliki 1 menu", 400);
    }

    const merged = new Map<number, number>();
    for (const item of input.items) {
      const qty = Math.trunc(item.quantity);
      if (qty <= 0) throw new AppError("Jumlah item harus lebih dari 0", 400);
      merged.set(item.menuId, (merged.get(item.menuId) ?? 0) + qty);
    }

    return this.withTx(async (client) => {
      const menuIds = Array.from(merged.keys()).sort((a, b) => a - b);
      const resolvedItems: Array<{ menu: Menu; qty: number }> = [];
      let totalAmount = 0;

      for (const menuId of menuIds) {
        const res = await client.query(
          "SELECT * FROM menus WHERE id = $1 AND is_active = TRUE FOR UPDATE",
          [menuId]
        );
        if (res.rows.length === 0) {
          throw new AppError("Salah satu menu tidak ditemukan atau nonaktif", 400);
        }
        const menu = mapMenuRow(res.rows[0]);
        const qty = merged.get(menuId)!;
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

      const now = new Date();
      const dateKey = toWIBDateKey(now.toISOString());
      const compactDate = dateKey.replace(/-/g, "").slice(2);
      const { startIso, endIso } = getWIBDateRange(dateKey, dateKey);
      const countRes = await client.query(
        "SELECT COUNT(*)::int AS count FROM orders WHERE created_at >= $1 AND created_at <= $2",
        [startIso, endIso]
      );
      const seq = Number(countRes.rows[0].count) + 1;
      const randomSuffix = Math.floor(Math.random() * 90 + 10);
      let orderNumber = `ORD-${compactDate}-${String(seq).padStart(3, "0")}`;

      // Ensure uniqueness under concurrency
      const dupCheck = await client.query(
        "SELECT 1 FROM orders WHERE order_number = $1",
        [orderNumber]
      );
      if (dupCheck.rows.length > 0) {
        orderNumber = `ORD-${compactDate}-${String(seq).padStart(3, "0")}-${randomSuffix}`;
      }

      const orderRes = await client.query(
        `INSERT INTO orders (
           order_number, customer_name, cashier_id, cashier_name,
           total_amount, payment_method, amount_paid, change_amount, status, notes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', $9)
         RETURNING *`,
        [
          orderNumber,
          input.customerName?.trim() || "Pelanggan Umum",
          actor.userId,
          actor.name,
          totalAmount,
          input.paymentMethod,
          amountPaid,
          amountPaid - totalAmount,
          input.notes?.trim() || "",
        ]
      );
      const orderRow = orderRes.rows[0];
      const orderId = Number(orderRow.id);
      const items: OrderItem[] = [];

      for (const { menu, qty } of resolvedItems) {
        const subtotal = menu.price * qty;
        const itemRes = await client.query(
          `INSERT INTO order_items (order_id, menu_id, menu_name, category, price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [orderId, menu.id, menu.name, menu.category, menu.price, qty, subtotal]
        );
        const ir = itemRes.rows[0];
        items.push({
          id: Number(ir.id),
          orderId,
          menuId: Number(ir.menu_id),
          menuName: String(ir.menu_name),
          category: String(ir.category) as MenuCategory,
          price: Number(ir.price),
          quantity: Number(ir.quantity),
          subtotal: Number(ir.subtotal),
        });

        if (menu.trackStock) {
          const nextStock = menu.stock - qty;
          await client.query("UPDATE menus SET stock = $1 WHERE id = $2", [
            nextStock,
            menu.id,
          ]);
          await client.query(
            `INSERT INTO stock_logs (menu_id, menu_name, change_amount, stock_after, reason, note, created_by_name)
             VALUES ($1, $2, $3, $4, 'sale', $5, $6)`,
            [menu.id, menu.name, -qty, nextStock, `Order ${orderNumber}`, actor.name]
          );
        }
      }

      return this.mapOrderRow(orderRow, items);
    });
  }

  private mapOrderRow(row: Record<string, unknown>, items: OrderItem[]): Order {
    return {
      id: Number(row.id),
      orderNumber: String(row.order_number),
      customerName: String(row.customer_name),
      cashierId: Number(row.cashier_id),
      cashierName: String(row.cashier_name),
      totalAmount: Number(row.total_amount),
      paymentMethod: String(row.payment_method) as PaymentMethod,
      amountPaid: Number(row.amount_paid),
      changeAmount: Number(row.change_amount),
      status: String(row.status) as OrderStatus,
      notes: String(row.notes || ""),
      cancelReason: row.cancel_reason ? String(row.cancel_reason) : null,
      cancelledByName: row.cancelled_by_name ? String(row.cancelled_by_name) : null,
      cancelledAt: row.cancelled_at
        ? new Date(String(row.cancelled_at)).toISOString()
        : null,
      createdAt: new Date(String(row.created_at)).toISOString(),
      items,
    };
  }

  private async attachItems(rows: Record<string, unknown>[]): Promise<Order[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => Number(r.id));
    const itemsRes = await this.pool.query(
      "SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id ASC",
      [ids]
    );
    const itemsByOrder = new Map<number, OrderItem[]>();
    for (const ir of itemsRes.rows) {
      const orderId = Number(ir.order_id);
      const list = itemsByOrder.get(orderId) ?? [];
      list.push({
        id: Number(ir.id),
        orderId,
        menuId: Number(ir.menu_id),
        menuName: String(ir.menu_name),
        category: String(ir.category) as MenuCategory,
        price: Number(ir.price),
        quantity: Number(ir.quantity),
        subtotal: Number(ir.subtotal),
      });
      itemsByOrder.set(orderId, list);
    }
    return rows.map((r) => this.mapOrderRow(r, itemsByOrder.get(Number(r.id)) ?? []));
  }

  async listOrders(filters?: {
    dateFrom?: string;
    dateTo?: string;
    status?: OrderStatus | "all";
    limit?: number;
  }): Promise<Order[]> {
    await this.ensureInitialized();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.dateFrom && filters?.dateTo) {
      const { startIso, endIso } = getWIBDateRange(filters.dateFrom, filters.dateTo);
      params.push(startIso);
      conditions.push(`created_at >= $${params.length}`);
      params.push(endIso);
      conditions.push(`created_at <= $${params.length}`);
    }

    if (filters?.status && filters.status !== "all") {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    let sql = "SELECT * FROM orders";
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY id DESC";

    if (filters?.limit) {
      params.push(filters.limit);
      sql += ` LIMIT $${params.length}`;
    }

    const res = await this.pool.query(sql, params);
    return this.attachItems(res.rows);
  }

  async getOrderById(id: number): Promise<Order | null> {
    await this.ensureInitialized();
    const res = await this.pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    const attached = await this.attachItems(res.rows);
    return attached[0] ?? null;
  }

  async cancelOrder(
    id: number,
    reason: string,
    actor: SessionUser
  ): Promise<Order> {
    return this.withTx(async (client) => {
      const orderRes = await client.query(
        "SELECT * FROM orders WHERE id = $1 FOR UPDATE",
        [id]
      );
      if (orderRes.rows.length === 0) {
        throw new AppError("Pesanan tidak ditemukan", 404);
      }
      const orderRow = orderRes.rows[0];
      if (orderRow.status === "cancelled") {
        throw new AppError("Pesanan ini sudah dibatalkan sebelumnya", 400);
      }

      const finalReason = reason.trim() || "Dibatalkan oleh Admin";
      const updatedOrder = await client.query(
        `UPDATE orders
         SET status = 'cancelled', cancel_reason = $1, cancelled_by_name = $2, cancelled_at = NOW()
         WHERE id = $3 RETURNING *`,
        [finalReason, actor.name, id]
      );

      const itemsRes = await client.query(
        "SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC",
        [id]
      );
      const items: OrderItem[] = [];

      for (const ir of itemsRes.rows) {
        const item: OrderItem = {
          id: Number(ir.id),
          orderId: id,
          menuId: Number(ir.menu_id),
          menuName: String(ir.menu_name),
          category: String(ir.category) as MenuCategory,
          price: Number(ir.price),
          quantity: Number(ir.quantity),
          subtotal: Number(ir.subtotal),
        };
        items.push(item);

        const menuRes = await client.query(
          "SELECT * FROM menus WHERE id = $1 FOR UPDATE",
          [item.menuId]
        );
        if (menuRes.rows.length > 0 && Boolean(menuRes.rows[0].track_stock)) {
          const nextStock = Number(menuRes.rows[0].stock) + item.quantity;
          await client.query("UPDATE menus SET stock = $1 WHERE id = $2", [
            nextStock,
            item.menuId,
          ]);
          await client.query(
            `INSERT INTO stock_logs (menu_id, menu_name, change_amount, stock_after, reason, note, created_by_name)
             VALUES ($1, $2, $3, $4, 'cancel', $5, $6)`,
            [
              item.menuId,
              String(menuRes.rows[0].name),
              item.quantity,
              nextStock,
              `Batal ${orderRow.order_number}: ${finalReason}`,
              actor.name,
            ]
          );
        }
      }

      return this.mapOrderRow(updatedOrder.rows[0], items);
    });
  }

  async getSalesReport(dateFrom: string, dateTo: string): Promise<SalesReport> {
    await this.ensureInitialized();
    const [orders, menus, categories] = await Promise.all([
      this.listOrders({ dateFrom, dateTo }),
      this.listMenus(true),
      this.listCategories(),
    ]);

    const completed = orders.filter((o) => o.status === "completed");
    const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

    let totalRevenue = 0;
    let cashRevenue = 0;
    let qrisRevenue = 0;
    let cashOrders = 0;
    let qrisOrders = 0;

    const menuMap = new Map<number, MenuSalesSummary>();
    for (const m of menus) {
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
          const menuRef = menus.find((m) => m.id === item.menuId);
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

    const catOrderMap = new Map(categories.map((c) => [c.slug, c.sortOrder]));
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
    await this.ensureInitialized();
    const res = await this.pool.query("SELECT * FROM store_settings WHERE id = 1");
    if (res.rows.length === 0) return { ...DEFAULT_STORE_SETTINGS };
    const r = res.rows[0];
    return {
      storeName: String(r.store_name),
      storeAddress: String(r.store_address),
      storePhone: String(r.store_phone),
      receiptFooter: String(r.receipt_footer),
      storeLogo: r.store_logo ? String(r.store_logo) : "",
    };
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    await this.ensureInitialized();
    if (
      settings.storeLogo !== undefined &&
      settings.storeLogo.length > 500_000
    ) {
      throw new AppError("Ukuran file logo terlalu besar (maks. 500KB)", 400);
    }
    const cur = await this.getSettings();
    const next: StoreSettings = {
      storeName: settings.storeName?.trim() || cur.storeName,
      storeAddress:
        settings.storeAddress !== undefined
          ? settings.storeAddress.trim()
          : cur.storeAddress,
      storePhone:
        settings.storePhone !== undefined
          ? settings.storePhone.trim()
          : cur.storePhone,
      receiptFooter:
        settings.receiptFooter !== undefined
          ? settings.receiptFooter.trim()
          : cur.receiptFooter,
      storeLogo:
        settings.storeLogo !== undefined ? settings.storeLogo : cur.storeLogo,
    };

    await this.pool.query(
      `UPDATE store_settings
       SET store_name = $1, store_address = $2, store_phone = $3, receipt_footer = $4, store_logo = $5
       WHERE id = 1`,
      [
        next.storeName,
        next.storeAddress,
        next.storePhone,
        next.receiptFooter,
        next.storeLogo,
      ]
    );
    return next;
  }
}
