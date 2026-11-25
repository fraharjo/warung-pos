import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { handleApiError, requireAdmin } from "@/lib/api-helpers";
import type { UpdateMenuInput } from "@/lib/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const menuId = Number(id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      throw new AppError("ID menu tidak valid", 400);
    }
    const body = (await request.json()) as UpdateMenuInput;
    const menu = await getDb().updateMenu(menuId, body);
    return NextResponse.json({ menu });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const menuId = Number(id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      throw new AppError("ID menu tidak valid", 400);
    }
    await getDb().deleteMenu(menuId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
