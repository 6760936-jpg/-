"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

export function Header({ brandName, phone }: { brandName: string; phone: string }) {
  const pathname = usePathname();
  const { totalItems } = useCart();

  if (pathname.startsWith("/admin") || pathname.startsWith("/field")) return null;

  const links = [
    { href: "/profile", label: "Кабинет" },
  ];

  return (
    <>
      <div className="bg-zinc-950 text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 lg:px-10">
          <span>Оптовые поставки и готовые решения для розничных магазинов</span>
          <a className="hidden font-semibold sm:block" href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center" aria-label={`${brandName} — главная`}>
            <span className="relative block h-12 w-[190px] overflow-hidden rounded-xl bg-[#090a11] sm:h-14 sm:w-[245px]">
              <Image src="/brand/perspektiva-logo.png" alt="ПЕРСПЕКТИВА — оптовые решения для розницы" fill priority sizes="245px" className="scale-[1.45] object-cover object-center" />
            </span>
          </Link>
          <form action="/catalog" className="hidden min-w-0 flex-1 md:block">
            <input name="q" className="input bg-zinc-50" placeholder="Поиск по названию или артикулу" />
          </form>
          <nav className="ml-auto flex items-center gap-1" aria-label="Основная навигация">
            {links.map((link) => {
              const base = link.href.split("?")[0];
              const active = pathname === base;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-violet-50 text-violet-800"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link href="/cart" className="relative rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold hover:bg-zinc-50">
              Корзина
              {totalItems > 0 && (
                <span className="ml-2 inline-flex min-w-5 justify-center rounded-full bg-violet-700 px-1.5 py-0.5 text-[11px] text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </nav>
        </div>
        <div className="border-t border-zinc-100 md:hidden">
          <form action="/catalog" className="px-4 py-3">
            <input name="q" className="input" placeholder="Найти товар" />
          </form>
        </div>
      </header>
    </>
  );
}