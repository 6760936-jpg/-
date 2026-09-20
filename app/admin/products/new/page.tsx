import { ProductForm } from "@/components/ProductForm";
export const metadata = { title: "Новый товар" };
export default function NewProductPage() { return <div className="p-4 sm:p-6 lg:p-10"><div className="mb-8"><p className="eyebrow">Ассортимент</p><h1 className="mt-2 text-3xl font-semibold">Новый товар</h1><p className="mt-2 text-zinc-500">Добавьте фото, цены, остаток и метки витрины.</p></div><ProductForm /></div>; }
