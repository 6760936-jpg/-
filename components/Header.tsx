"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { AuthButton } from "@/components/AuthButton";

export function Header({
  brandName,
  phone,
  isLoggedIn,
}: {
  brandName: string;
  phone: string;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const { totalItems } = useCart();

  if (pathname.startsWith("/admin") || pathname.startsWith("/field")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-10">
        <span className="flex shrink-0 items-center" aria-label={brandName}>
          <span className="relative block h-12 w-[190px] overflow-hidden rounded-xl bg-[#090a11] sm:h-14 sm:w-[245px]">
            <Image
              src="/brand/perspektiva-logo.png"
              alt="ПЕРСПЕКТИВА — оптовые решения для розницы"
              fill
              priority
              sizes="245px"
              className="scale-[1.45] object-cover object-center"
            />
          </span>
        </span>

        <form action="/catalog" className="hidden min-w-0 flex-1 md:block">
          <input
            name="q"
            className="input bg-zinc-50"
            placeholder="Поиск по названию или артикулу"
          />
        </form>

        <nav className="ml-auto flex items-center gap-2" aria-label="Основная навигация">
          <Link
            href="/cart"
            className="relative rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold hover:bg-zinc-50"
          >
            Корзина
            {totalItems > 0 && (
              <span className="ml-2 inline-flex min-w-5 justify-center rounded-full bg-violet-700 px-1.5 py-0.5 text-[11px] text-white">
                {totalItems}
              </span>
            )}
          </Link>

          <AuthButton isLoggedIn={isLoggedIn} />
        </nav>
      </div>

      <div className="border-t border-zinc-100 md:hidden">
        <form action="/catalog" className="px-4 py-3">
          <input name="q" className="input" placeholder="Найти товар" />
        </form>
      </div>
    </header>
  );
}