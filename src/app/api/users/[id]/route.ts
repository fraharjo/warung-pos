import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { handleApiError, requireAdmin } from "@/lib/api-helpers";
import type { UpdateUserInput } from "@/lib/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError("ID pengguna tidak valid", 400);
    }
    const body = (await request.json()) as UpdateUserInput;
    const user = await getDb().updateUser(userId, body, admin.userId);
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError("ID pengguna tidak valid", 400);
    }
    await getDb().deleteUser(userId, admin.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
