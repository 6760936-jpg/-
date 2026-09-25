import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "ПЕРСПЕКТИВА — оптовые решения для розницы",
    template: "%s | ПЕРСПЕКТИВА",
  },
  description:
    "Оптовый каталог товаров для розничных магазинов, заказы, доставка и обслуживание торговых точек.",
  icons: { icon: "/brand/perspektiva-logo.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await prisma.siteSettings
    .findUnique({ where: { id: 1 } })
    .catch(() => null);
  const user = await getCurrentUser();
  const brandName = settings?.brandName ?? "ПЕРСПЕКТИВА";
  const phone = settings?.phone ?? "+7 900 000-00-00";

  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <CartProvider>
          <Header
            brandName={brandName}
            phone={phone}
            isLoggedIn={Boolean(user)}
          />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}