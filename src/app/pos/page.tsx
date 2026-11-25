import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getTodayWIB } from "@/lib/format";
import { PosClient } from "@/components/PosClient";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const db = getDb();
  const today = getTodayWIB();
  const [menus, todayOrders, settings, categories] = await Promise.all([
    db.listMenus(false),
    db.listOrders({ dateFrom: today, dateTo: today }),
    db.getSettings(),
    db.listCategories(),
  ]);

  return (
    <PosClient
      user={session}
      initialMenus={menus}
      initialOrders={todayOrders}
      initialCategories={categories}
      settings={settings}
    />
  );
}
