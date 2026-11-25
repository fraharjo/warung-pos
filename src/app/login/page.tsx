import { getDb } from "@/lib/db";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let storeName = "Ayam Bakar Spesial";
  let storeLogo = "";
  try {
    const settings = await getDb().getSettings();
    if (settings.storeName?.trim()) {
      storeName = settings.storeName;
    }
    storeLogo = settings.storeLogo || "";
  } catch {
    // Fallback to default store name if settings unavailable
  }

  return <LoginForm storeName={storeName} storeLogo={storeLogo} />;
}
