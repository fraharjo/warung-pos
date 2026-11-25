import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { handleApiError, requireAdmin } from "@/lib/api-helpers";
import type { CreateUserInput } from "@/lib/types";

export async function GET() {
  try {
    await requireAdmin();
    const users = await getDb().listUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as CreateUserInput;
    const user = await getDb().createUser(body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
