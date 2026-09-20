import Link from "next/link";
import { AdminProductTable } from "@/components/AdminProductTable";
export const metadata = { title: "Товары" };
export default function AdminProductsPage() { return <div className="p-4 sm:p-6 lg:p-10"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Ассортимент</p><h1 className="mt-2 text-3xl font-semibold">Товары</h1><p className="mt-2 text-zinc-500">Цены, закупка, остатки, фото и товарные метки.</p></div><Link href="/admin/products/new" className="button-primary">+ Добавить товар</Link></div><AdminProductTable /></div>; }
