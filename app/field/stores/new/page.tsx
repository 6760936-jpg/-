import { requireField } from "@/lib/auth";
import { createFieldStoreAction } from "@/lib/field-actions";
import { LocationPicker } from "@/components/LocationPicker";

export default async function NewFieldStorePage() {
  await requireField();
  return (
    <div className="container-page max-w-3xl">
      <div>
        <p className="eyebrow">РќРѕРІР°СЏ С‚РѕС‡РєР°</p>
        <h1 className="mt-2 text-3xl font-semibold">Р”РѕР±Р°РІРёС‚СЊ РјР°РіР°Р·РёРЅ</h1>
        <p className="mt-2 text-zinc-500">РЈРєР°Р¶РёС‚Рµ Р°РґСЂРµСЃ Рё С‚РѕС‡РЅСѓСЋ С‚РѕС‡РєСѓ РјР°РіР°Р·РёРЅР° РЅР° РєР°СЂС‚Рµ. РћРЅР° СЃСЂР°Р·Сѓ РїРѕРїР°РґС‘С‚ РЅР° РєР°СЂС‚Сѓ Р»РёРЅРёР№ Рё РјР°СЂС€СЂСѓС‚РѕРІ.</p>
      </div>
      <form action={createFieldStoreAction} className="surface-card mt-8 grid gap-5 p-6 sm:grid-cols-2">
        <label><span className="field-label">РќР°Р·РІР°РЅРёРµ</span><input className="input" name="name" required /></label>
        <label><span className="field-label">РўРµР»РµС„РѕРЅ</span><input className="input" name="phone" type="tel" /></label>
        <label className="sm:col-span-2"><span className="field-label">Населённый пункт</span><input className="input" name="settlement" placeholder="Например, Индерей" required /></label>
        <label className="sm:col-span-2"><span className="field-label">Адрес</span><input className="input" name="address" required /></label>
        <div className="sm:col-span-2"><LocationPicker required /></div>
        <label><span className="field-label">РљРѕРЅС‚Р°РєС‚РЅРѕРµ Р»РёС†Рѕ</span><input className="input" name="contactName" /></label>
        <label><span className="field-label">Р’СЂРµРјСЏ СЂР°Р±РѕС‚С‹</span><input className="input" name="openingHours" /></label>
        <label><span className="field-label">РќРѕРјРµСЂ РїРѕР»РєРё</span><input className="input uppercase" name="shelfCode" placeholder="P-0004" /></label>
        <label><span className="field-label">Р¤РѕС‚Рѕ С„Р°СЃР°РґР°</span><input className="input" name="exteriorImage" type="file" accept="image/*" /></label>
        <label className="sm:col-span-2"><span className="field-label">Р’РЅСѓС‚СЂРµРЅРЅРµРµ РїСЂРёРјРµС‡Р°РЅРёРµ</span><textarea className="input min-h-28" name="notes" placeholder="РќР°РїСЂРёРјРµСЂ: Р·РІРѕРЅРёС‚СЊ Р·Р° 20 РјРёРЅСѓС‚, РІСЉРµР·Рґ СЃРѕ РґРІРѕСЂР°..." /></label>
        <button className="button-primary sm:col-span-2">РЎРѕС…СЂР°РЅРёС‚СЊ РјР°РіР°Р·РёРЅ</button>
      </form>
    </div>
  );
}
