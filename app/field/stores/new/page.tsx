import Link from "next/link";
import { requireField } from "@/lib/auth";
import { createFieldStoreAction } from "@/lib/field-actions";
import { LocationPicker } from "@/components/LocationPicker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Новый магазин" };

export default async function NewStorePage() {
  await requireField();

  return (
    <div className="container-page max-w-3xl">
      <Link href="/field" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
        ← Назад
      </Link>

      <h1 className="mt-4 text-3xl font-semibold">Новый магазин</h1>
      <p className="mt-2 text-zinc-500">
        Укажите адрес и точную точку магазина на карте.
      </p>

      <form action={createFieldStoreAction} className="surface-card mt-8 grid gap-5 p-6 sm:grid-cols-2">
        <label>
          <span className="field-label">Название</span>
          <input className="input" name="name" required />
        </label>
        <label>
          <span className="field-label">Телефон</span>
          <input className="input" name="phone" type="tel" />
        </label>
        <label className="sm:col-span-2">
          <span className="field-label">Населённый пункт</span>
          <input className="input" name="settlement" placeholder="Например, Индерей" required />
        </label>
        <label className="sm:col-span-2">
          <span className="field-label">Адрес</span>
          <input className="input" name="address" required />
        </label>
        <div className="sm:col-span-2">
          <LocationPicker required />
        </div>
        <label>
          <span className="field-label">Контактное лицо</span>
          <input className="input" name="contactName" />
        </label>
        <label>
          <span className="field-label">Время работы</span>
          <input className="input" name="openingHours" />
        </label>
        <label>
          <span className="field-label">Номер полки</span>
          <input className="input uppercase" name="shelfCode" placeholder="P-0004" />
        </label>
        <label>
          <span className="field-label">Фото фасада</span>
          <input className="input" name="exteriorImage" type="file" accept="image/*" />
        </label>
        <label className="sm:col-span-2">
          <span className="field-label">Внутреннее примечание</span>
          <textarea className="input min-h-28" name="notes" placeholder="Например: звонить за 20 минут..." />
        </label>
        <button className="button-primary sm:col-span-2">Сохранить магазин</button>
      </form>
    </div>
  );
}