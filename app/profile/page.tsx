import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileCatalog } from "@/components/ProfileCatalog";

export const metadata = { title: "Личный кабинет" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await requireUser("/profile");

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Каталог товаров</h2>
        <Link href="/catalog" className="button-secondary">
          Весь каталог →
        </Link>
      </div>
      <ProfileCatalog products={products} categories={categories} />
    </div>
  );
}