import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "ПЕРСПЕКТИВА — оптовые решения для розницы", template: "%s | ПЕРСПЕКТИВА" },
  description: "Оптовый каталог товаров для розничных магазинов, заказы, доставка и обслуживание торговых точек.",
  icons: { icon: "/brand/perspektiva-logo.png" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } }).catch(() => null);
  const brandName = settings?.brandName ?? "ПЕРСПЕКТИВА";
  const phone = settings?.phone ?? "+7 900 000-00-00";
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <CartProvider>
          <Header brandName={brandName} phone={phone} />
          <main>{children}</main>
          <footer className="mt-16 border-t border-zinc-200 bg-white">
            <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-10">
              <div>
                <div className="text-lg font-semibold tracking-wider">{brandName}</div>
                <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500">Оптовые товары, регулярные поставки и готовые решения для розничных магазинов.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Покупателям</h3>
                <div className="mt-3 space-y-2 text-sm text-zinc-500">
                  <a className="block hover:text-zinc-950" href="/catalog">Каталог</a>
                  <a className="block hover:text-zinc-950" href="/register">Регистрация магазина</a>
                  <a className="block hover:text-zinc-950" href="/profile">История заказов</a>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Контакты</h3>
                <p className="mt-3 text-sm text-zinc-500">{phone}<br />{settings?.email ?? "hello@example.ru"}<br />{settings?.city ?? "Ваш город"}</p>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
