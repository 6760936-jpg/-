"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/admin", "Обзор"], ["/admin/orders", "Заказы"], ["/admin/products", "Товары"], ["/admin/categories", "Категории"],
  ["/admin/promotions", "Акции"], ["/admin/stores", "Магазины"], ["/admin/shelves", "Полки"], ["/admin/routes", "Линии и маршруты"],
  ["/admin/finance", "Финансы"], ["/admin/spoilage", "Порча"], ["/admin/complaints", "Жалобы"], ["/admin/team", "Сотрудники"], ["/admin/settings", "Настройки"],
] as const;

export function AdminSidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const visibleLinks = links.filter(([href]) => href !== "/admin/finance" || role === "DIRECTOR");
  return (
    <aside className="border-b border-zinc-200 bg-zinc-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-[60] lg:w-64 lg:border-b-0 lg:border-r lg:border-white/10">
      <div className="flex items-center justify-between px-5 py-5 lg:block">
        <Link href="/admin" className="flex items-center"><span className="relative block h-11 w-[190px] overflow-hidden rounded-lg bg-[#090a11]"><Image src="/brand/perspektiva-logo.png" alt="ПЕРСПЕКТИВА" fill sizes="190px" className="scale-[1.45] object-cover object-center" /></span></Link>
        <Link href="/" className="text-xs text-zinc-400 hover:text-white lg:mt-4 lg:block">← Вернуться на сайт</Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {visibleLinks.map(([href, label]) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={`block shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>{label}</Link>; })}
      </nav>
      <div className="hidden border-t border-white/10 p-5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block"><div className="text-sm font-medium">{name}</div><div className="mt-1 text-xs text-zinc-500">{role === "DIRECTOR" ? "Генеральный директор" : "Администратор"}</div></div>
    </aside>
  );
}
