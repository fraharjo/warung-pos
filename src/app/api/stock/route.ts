import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { handleApiError, requireAdmin } from "@/lib/api-helpers";
import type { AdjustStockInput } from "@/lib/types";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit")) || 50));
    const db = getDb();
    const [menus, logs] = await Promise.all([
      db.listMenus(true),
      db.listStockLogs(limit),
    ]);
    return NextResponse.json({
      stockMenus: menus.filter((m) => m.trackStock),
      logs,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) as
      | AdjustStockInput
      | { items: AdjustStockInput[] };

    const db = getDb();
    if ("items" in body && Array.isArray(body.items)) {
      const updated = await db.adjustStockBatch(body.items, admin);
      return NextResponse.json({ menus: updated });
    }

    const updated = await db.adjustStock(body as AdjustStockInput, admin);
    return NextResponse.json({ menu: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
