import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { handleApiError, requireAdmin, requireAuth } from "@/lib/api-helpers";
import type { CreateMenuInput } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const includeInactive =
      searchParams.get("includeInactive") === "true" && user.role === "admin";
    const menus = await getDb().listMenus(includeInactive);
    return NextResponse.json({ menus });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) as CreateMenuInput;
    const menu = await getDb().createMenu(body, admin);
    return NextResponse.json({ menu }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
