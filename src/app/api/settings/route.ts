import { NextResponse } from "next/server";
import { getDb, getDbMode } from "@/lib/db";
import { handleApiError, requireAdmin, requireAuth } from "@/lib/api-helpers";
import type { StoreSettings } from "@/lib/types";

export async function GET() {
  try {
    await requireAuth();
    const settings = await getDb().getSettings();
    return NextResponse.json({ settings, dbMode: getDbMode() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Partial<StoreSettings>;
    const settings = await getDb().updateSettings(body);
    return NextResponse.json({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}
