import { AdminOrdersTable } from "@/components/AdminOrdersTable";
export const metadata={title:"Заказы"};
export default function AdminOrdersPage(){return <div className="p-4 sm:p-6 lg:p-10"><div className="mb-8"><p className="eyebrow">Продажи</p><h1 className="mt-2 text-3xl font-semibold">Заказы</h1><p className="mt-2 text-zinc-500">Состав, статусы, покупатели и подготовка к доставке.</p></div><AdminOrdersTable/></div>}
