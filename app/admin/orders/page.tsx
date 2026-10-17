import { AdminOrdersTable } from "@/components/AdminOrdersTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Заказы" };

export default function AdminOrdersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <AdminOrdersTable />
    </div>
  );
}