"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

type Item = { href: string; label: string };
type Group = { title: string; items: Item[] };

export function AdminSidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const isDirector = role === "DIRECTOR";

  const groups: Group[] = [
    { title: "", items: [{ href: "/admin", label: "Обзор" }] },
    {
      title: "Продажи",
      items: [
        { href: "/admin/orders", label: "Заказы" },
        { href: "/admin/stores", label: "Магазины" },
      ],
    },
    {
      title: "Логистика",
      items: [{ href: "/admin/routes", label: "Линии и маршруты" }],
    },
    {
      title: "Товары",
      items: [
        { href: "/admin/products", label: "Каталог" },
        { href: "/admin/promotions", label: "Акции" },
        { href: "/admin/spoilage", label: "Порча" },
      ],
    },
    ...(isDirector
      ? [
          {
            title: "Финансы",
            items: [{ href: "/admin/finance", label: "Финансы" }],
          } as Group,
        ]
      : []),
    {
      title: "Обратная связь",
      items: [{ href: "/admin/complaints", label: "Жалобы и предложения" }],
    },
    {
      title: "Система",
      items: [
        { href: "/admin/team", label: "Сотрудники" },
        { href: "/admin/settings", label: "Настройки" },
      ],
    },
  ];

  return (
    <aside className="border-b border-zinc-200 bg-zinc-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-[60] lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:border-white/10">
      <div className="flex items-center justify-between px-5 py-5 lg:block">
        <Link href="/admin" className="flex items-center">
          <span className="relative block h-11 w-[190px] overflow-hidden rounded-lg bg-[#090a11]">
            <Image
              src="/brand/perspektiva-logo.png"
              alt="ПЕРСПЕКТИВА"
              fill
              sizes="190px"
              className="scale-[1.45] object-cover object-center"
            />
          </span>
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:flex-1 lg:space-y-4 lg:overflow-visible lg:pb-0">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <div className="mb-1 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {group.title}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-violet-600 text-white"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-5">
        <div className="text-sm font-medium">{name}</div>
        <div className="mt-1 text-xs text-zinc-500">
          {isDirector ? "Генеральный директор" : "Администратор"}
        </div>
        <div className="mt-3">
          <LogoutButton className="w-full rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5 hover:text-white" />
        </div>
      </div>
    </aside>
  );
}