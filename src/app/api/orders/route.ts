import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getTodayWIB } from "@/lib/format";
import { handleApiError, requireAuth } from "@/lib/api-helpers";
import type { CreateOrderInput, OrderStatus } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const today = getTodayWIB();

    // Kasir hanya bisa lihat pesanan hari ini; Admin bisa filter rentang tanggal bebas
    const dateFrom =
      user.role === "admin"
        ? searchParams.get("dateFrom") || today
        : today;
    const dateTo =
      user.role === "admin"
        ? searchParams.get("dateTo") || today
        : today;
    const statusParam = (searchParams.get("status") || "all") as OrderStatus | "all";
    const limit = Number(searchParams.get("limit")) || 200;

    const orders = await getDb().listOrders({
      dateFrom,
      dateTo,
      status: statusParam,
      limit,
    });

    return NextResponse.json({ orders, dateFrom, dateTo });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = (await request.json()) as CreateOrderInput;
    const order = await getDb().createOrder(body, user);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
