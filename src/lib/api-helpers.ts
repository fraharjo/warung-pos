import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { AppError } from "./errors";
import type { SessionUser } from "./types";

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new AppError("Silakan login terlebih dahulu", 401);
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "admin") {
    throw new AppError("Akses ditolak: khusus Admin", 403);
  }
  return session;
}

function isAppError(err: unknown): err is AppError {
  if (err instanceof AppError) return true;
  if (
    err instanceof Error &&
    err.name === "AppError" &&
    "statusCode" in err &&
    typeof (err as { statusCode?: unknown }).statusCode === "number"
  ) {
    return true;
  }
  return false;
}

export function handleApiError(err: unknown) {
  if (isAppError(err)) {
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode }
    );
  }
  console.error("[API Error]", err);
  return NextResponse.json(
    { error: "Terjadi kesalahan pada server" },
    { status: 500 }
  );
}
