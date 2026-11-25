import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getTodayWIB } from "@/lib/format";
import { handleApiError, requireAdmin } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const today = getTodayWIB();
    const dateFrom = searchParams.get("dateFrom") || today;
    const dateTo = searchParams.get("dateTo") || today;

    const report = await getDb().getSalesReport(dateFrom, dateTo);
    return NextResponse.json({ report });
  } catch (err) {
    return handleApiError(err);
  }
}
