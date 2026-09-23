"use client";

import Link from "next/link";
import { useFieldCart } from "@/context/FieldCartContext";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";

export default function FieldCartPage() {
  const { items, totalItems, totalPrice, removeItem, setQuantity, clearCart } =
    useFieldCart();

  return (
    <div className="container-page max-w-5xl">
      <div className="mb-8">
        <p className="eyebrow">Продажа магазину</p>
        <h1 className="mt-2 text-3xl font-semibold">Корзина</h1>
      </div>

      {items.length === 0 ? (
        <div className="surface-card border-dashed p-12 text-center">
          <h2 className="text-2xl font-semibold">Корзина пуста</h2>
          <p className="mt-2 text-zinc-500">
            Добавьте товары из каталога, чтобы оформить продажу.
          </p>
          <Link href="/field/catalog" className="button-primary mt-6">
            Открыть каталог
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.productId}
                className="surface-card grid gap-4 p-4 sm:grid-cols-[90px_1fr_auto] sm:items-center"
              >
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  className="aspect-square w-full rounded-xl"
                />
                <div>
                  <h2 className="font-semibold">{item.name}</h2>
                  <p className="mt-1 text-xs text-zinc-500">{item.article}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatCurrency(item.price)} · макс. {item.maxQuantity} шт
                  </p>
                  <button
                    className="mt-2 text-sm font-semibold text-rose-600"
                    onClick={() => removeItem(item.productId)}
                  >
                    Удалить
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                  <div className="inline-flex items-center rounded-xl border border-zinc-300">
                    <button
                      className="size-10 font-semibold hover:bg-zinc-100"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      −
                    </button>
                    <input
                      className="w-14 border-x border-zinc-300 py-2 text-center text-sm font-semibold outline-none"
                      type="number"
                      min={1}
                      max={item.maxQuantity}
                      value={item.quantity}
                      onChange={(e) =>
                        setQuantity(
                          item.productId,
                          Number(e.target.value),
                        )
                      }
                    />
                    <button
                      className="size-10 font-semibold hover:bg-zinc-100"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <strong className="block text-lg sm:mt-3">
                    {formatCurrency(item.price * item.quantity)}
                  </strong>
                </div>
              </article>
            ))}
            <button
              className="text-sm font-semibold text-zinc-500 hover:text-rose-600"
              onClick={clearCart}
            >
              Очистить корзину
            </button>
          </div>

          <aside className="surface-card h-fit p-6">
            <h2 className="text-xl font-semibold">Итого</h2>
            <div className="mt-6 space-y-3 border-b border-zinc-200 pb-5 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Позиций</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Всего штук</span>
                <span>{totalItems}</span>
              </div>
            </div>
            <div className="flex items-end justify-between pt-5">
              <span className="font-semibold">Сумма</span>
              <strong className="text-2xl font-semibold">
                {formatCurrency(totalPrice)}
              </strong>
            </div>
            <Link
              href="/field/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Оформить продажу
            </Link>
            <Link
              href="/field/catalog"
              className="button-secondary mt-3 w-full"
            >
              Продолжить выбор
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}