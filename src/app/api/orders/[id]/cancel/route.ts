import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { handleApiError, requireAdmin } from "@/lib/api-helpers";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Hanya Admin yang boleh membatalkan pesanan
    const admin = await requireAdmin();
    const { id } = await context.params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new AppError("ID pesanan tidak valid", 400);
    }

    let reason = "";
    try {
      const body = (await request.json()) as { reason?: string };
      reason = body.reason ?? "";
    } catch {
      reason = "";
    }

    const order = await getDb().cancelOrder(orderId, reason, admin);
    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
