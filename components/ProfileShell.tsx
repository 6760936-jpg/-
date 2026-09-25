"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

type User = { name: string; role: string };

export function ProfileShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/profile", label: "Главная" },
    { href: "/profile/warehouse", label: "Полка · Задолженность" },
    { href: "/profile/orders", label: "История заказов" },
    { href: "/profile/feedback", label: "Жалобы и предложения" },
    { href: "/profile/settings", label: "Профиль" },
  ];

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-[100] flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
        aria-label="Открыть меню"
      >
        <span className="text-xl">☰</span>
      </button>

      {open && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 z-[110] bg-black/40"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[120] flex w-60 flex-col border-r border-white/10 bg-zinc-950 text-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <span className="relative block h-10 w-[170px] overflow-hidden rounded-lg bg-[#090a11]">
            <Image
              src="/brand/perspektiva-logo.png"
              alt="ПЕРСПЕКТИВА"
              fill
              sizes="170px"
              className="scale-[1.45] object-cover object-center"
            />
          </span>
          <button
            type="button"
            onClick={closeMenu}
            className="ml-2 flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-2 pb-2">
          {links.map((link) => {
            const active =
              link.href === "/profile"
                ? pathname === link.href
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4" onClick={closeMenu}>
          <div className="text-sm font-medium">{user.name}</div>
          <div className="mt-2">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div>{children}</div>
    </div>
  );
}