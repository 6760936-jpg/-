import { requireField } from "@/lib/auth";
import { createFieldStoreAction } from "@/lib/field-actions";
import { LocationPicker } from "@/components/LocationPicker";

export default async function NewFieldStorePage() {
  await requireField();
  return (
    <div className="container-page max-w-3xl">
      <div>
        <p className="eyebrow">Новая точка</p>
        <h1 className="mt-2 text-3xl font-semibold">Добавить магазин</h1>
        <p className="mt-2 text-zinc-500">Укажите адрес и точную точку магазина на карте. Она сразу попадёт на карту линий и маршрутов.</p>
      </div>
      <form action={createFieldStoreAction} className="surface-card mt-8 grid gap-5 p-6 sm:grid-cols-2">
        <label><span className="field-label">Название</span><input className="input" name="name" required /></label>
        <label><span className="field-label">Телефон</span><input className="input" name="phone" type="tel" /></label>
        <label className="sm:col-span-2"><span className="field-label">Адрес</span><input className="input" name="address" required /></label>
        <div className="sm:col-span-2"><LocationPicker required /></div>
        <label><span className="field-label">Контактное лицо</span><input className="input" name="contactName" /></label>
        <label><span className="field-label">Время работы</span><input className="input" name="openingHours" /></label>
        <label><span className="field-label">Номер полки</span><input className="input uppercase" name="shelfCode" placeholder="P-0004" /></label>
        <label><span className="field-label">Фото фасада</span><input className="input" name="exteriorImage" type="file" accept="image/*" /></label>
        <label className="sm:col-span-2"><span className="field-label">Внутреннее примечание</span><textarea className="input min-h-28" name="notes" placeholder="Например: звонить за 20 минут, въезд со двора..." /></label>
        <button className="button-primary sm:col-span-2">Сохранить магазин</button>
      </form>
    </div>
  );
}
