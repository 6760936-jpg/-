import { prisma } from "@/lib/prisma";
import { requireField } from "@/lib/auth";
import { FieldCheckoutClient } from "./client";

export const dynamic = "force-dynamic";

export default async function FieldCheckoutPage() {
  await requireField();

  const stores = await prisma.store.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true },
  });

  return (
    <div className="container-page max-w-6xl">
      <div className="mb-8">
        <p className="eyebrow">Продажа магазину</p>
        <h1 className="mt-2 text-3xl font-semibold">Оформление продажи</h1>
        <p className="mt-2 text-zinc-500">
          Выберите магазин и способ оплаты, затем подтвердите.
        </p>
      </div>

      <FieldCheckoutClient stores={stores} />
    </div>
  );
}