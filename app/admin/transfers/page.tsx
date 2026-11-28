import { prisma } from "@/lib/prisma";
import TransferForm from "./TransferForm";

export default async function TransfersPage() {
  const drivers = await prisma.user.findMany({ where: { role: "FIELD" } });
  const products = await prisma.product.findMany({ where: { stock: { gt: 0 } }, orderBy: { name: 'asc' } });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Передача товара водителям</h1>
        <p className="text-gray-500 mt-2">Загрузите товар со склада в машину конкретного водителя</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <TransferForm drivers={drivers} products={products} />
      </div>
    </div>
  );
}