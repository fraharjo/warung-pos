import { NextResponse } from "next/server";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { handleApiError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";

    if (!username || !password) {
      throw new AppError("Username dan password wajib diisi", 400);
    }

    const db = getDb();
    const user = await db.findUserByUsername(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new AppError("Username atau password salah", 401);
    }

    const sessionUser = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({ user: sessionUser });
  } catch (err) {
    return handleApiError(err);
  }
}
