"use client";

import Link from "next/link";
import { useFieldCart } from "@/context/FieldCartContext";

export function FieldCartButton() {
  const { totalItems } = useFieldCart();

  return (
    <Link
      href="/field/cart"
      className="relative rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
    >
      Корзина
      {totalItems > 0 && (
        <span className="ml-2 inline-flex min-w-5 justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-violet-700">
          {totalItems}
        </span>
      )}
    </Link>
  );
}