import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";
import { deleteCategoryAction, updateCategoryAction } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) notFound();

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      products: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!category) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mb-6">
        <Link
          href="/admin/categories"
          className="text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          ← Все категории
        </Link>
        <h1 className="mt-3 text-3xl font-semibold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-zinc-500">{category.description}</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <span className="admin-chip">
            Товаров: {category.products.length}
          </span>
          <span className="admin-chip">
            {category.active ? "Активна" : "Скрыта"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* Форма редактирования категории */}
        <form
          action={updateCategoryAction}
          className="surface-card h-fit space-y-4 p-5"
        >
          <h2 className="font-semibold">Редактировать категорию</h2>
          <input type="hidden" name="id" value={category.id} />

          <label>
            <span className="field-label">Название</span>
            <input
              className="input"
              name="name"
              defaultValue={category.name}
              required
            />
          </label>

          <label>
            <span className="field-label">Описание</span>
            <textarea
              className="input min-h-24"
              name="description"
              defaultValue={category.description ?? ""}
            />
          </label>

          <label>
            <span className="field-label">Порядок</span>
            <input
              className="input"
              name="sortOrder"
              type="number"
              defaultValue={category.sortOrder}
            />
          </label>

          <label>
            <span className="field-label">Фото</span>
            <input
              className="input"
              name="image"
              type="file"
              accept="image/*"
            />
            {category.image && (
              <span className="mt-2 block text-xs text-zinc-400">
                Текущее фото загружено
              </span>
            )}
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="active"
              value="true"
              defaultChecked={category.active}
              className="size-5"
            />
            <span className="text-sm font-medium">Категория активна</span>
          </label>

          <button className="button-primary w-full">
            Сохранить изменения
          </button>
        </form>

        {/* Товары категории */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Товары категории
          </h2>

          {category.products.length === 0 ? (
            <div className="surface-card border-dashed p-10 text-center">
              <p className="text-zinc-500">
                В этой категории пока нет товаров.
              </p>
              <Link
                href="/admin/products/new"
                className="button-primary mt-5"
              >
                Добавить товар
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {category.products.map((p) => (
                <article
                  key={p.id}
                  className="surface-card flex items-center gap-4 p-4"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-50">
                    <ProductImage
                      src={p.image}
                      alt={p.name}
                      className="h-12 w-12 object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-semibold hover:text-violet-700"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-zinc-400">{p.article}</p>
                  </div>
                  <div className="text-right">
                    <strong className="block">
                      {formatCurrency(p.price)}
                    </strong>
                    <span className="text-xs text-zinc-400">
                      Остаток: {p.stock}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Удаление категории */}
      <form action={deleteCategoryAction} className="mt-10">
        <input type="hidden" name="id" value={category.id} />
        <button className="text-sm font-semibold text-rose-600 hover:text-rose-800">
          Удалить категорию
        </button>
      </form>
    </div>
  );
}