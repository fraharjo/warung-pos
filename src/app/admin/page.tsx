import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb, getDbMode } from "@/lib/db";
import { getTodayWIB } from "@/lib/format";
import { AdminClient } from "@/components/admin/AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "admin") {
    redirect("/pos");
  }

  const db = getDb();
  const today = getTodayWIB();

  const [report, menus, stockLogs, orders, users, settings, categories] =
    await Promise.all([
      db.getSalesReport(today, today),
      db.listMenus(true),
      db.listStockLogs(200),
      db.listOrders({ dateFrom: today, dateTo: today }),
      db.listUsers(),
      db.getSettings(),
      db.listCategories(),
    ]);

  return (
    <AdminClient
      user={session}
      dbMode={getDbMode()}
      initialReport={report}
      initialMenus={menus}
      initialCategories={categories}
      initialStockLogs={stockLogs}
      initialOrders={orders}
      initialUsers={users}
      initialSettings={settings}
    />
  );
}
