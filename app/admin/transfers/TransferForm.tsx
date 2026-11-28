"use client";
import { useState } from "react";
import { transferToDriver } from "./actions";

export default function TransferForm({ drivers, products }: { drivers: any[], products: any[] }) {
  const [status, setStatus] = useState<{ type: "error" | "success", text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setStatus(null);
    const result = await transferToDriver(formData);
    if (result.error) setStatus({ type: "error", text: result.error });
    if (result.success) setStatus({ type: "success", text: result.success });
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Водитель</label>
          <select name="driverId" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
            <option value="">Выберите водителя</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Товар</label>
          <select name="productId" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
            <option value="">Выберите товар</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} (На складе: {p.stock} шт.)</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Количество</label>
        <input type="number" name="quantity" min="1" required placeholder="Введите количество" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
      </div>
      
      {status && (
        <div className={`p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {status.text}
        </div>
      )}

      <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50">
        {loading ? "Загрузка..." : "Передать водителю"}
      </button>
    </form>
  );
}