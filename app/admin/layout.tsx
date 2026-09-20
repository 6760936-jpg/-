import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <div className="min-h-screen bg-zinc-100 lg:pl-64"><AdminSidebar name={user.name} role={user.role} /><div className="min-w-0">{children}</div></div>;
}
