import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { handleApiError, requireAdmin } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { orderedIds?: number[] };
    await getDb().reorderMenus(body.orderedIds ?? []);
    const menus = await getDb().listMenus(true);
    return NextResponse.json({ menus });
  } catch (err) {
    return handleApiError(err);
  }
}
