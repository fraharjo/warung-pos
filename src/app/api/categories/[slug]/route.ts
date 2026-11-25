import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { handleApiError, requireAdmin } from "@/lib/api-helpers";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin();
    const { slug } = await context.params;
    await getDb().deleteCategory(decodeURIComponent(slug));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
