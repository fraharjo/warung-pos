import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { handleApiError, requireAdmin, requireAuth } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireAuth();
    const categories = await getDb().listCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { name?: string };
    const category = await getDb().createCategory(body.name ?? "");
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
