"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LocationPicker } from "@/components/LocationPicker";

type Props = {
  initialName: string;
  initialShopName: string;
  initialPhone: string;
  initialAddress?: string;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  hasStore?: boolean;
};

export function ProfileSettingsForm({ initialName, initialShopName, initialPhone, initialAddress = "", initialLatitude = null, initialLongitude = null, hasStore = false }: Props) {
  const router = useRouter();
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileSubmitting(true); setProfileError(""); setProfileSuccess("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error ?? "Не удалось сохранить данные.");
      setProfileSuccess(data.message ?? "Данные сохранены.");
      router.refresh();
    } catch (error) { setProfileError(error instanceof Error ? error.message : "Не удалось сохранить данные."); }
    finally { setProfileSubmitting(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPasswordSubmitting(true); setPasswordError(""); setPasswordSuccess("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/profile/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { error?: string; message?: string; reauth?: boolean };
      if (!response.ok) throw new Error(data.error ?? "Не удалось изменить пароль.");
      setPasswordSuccess(data.message ?? "Пароль изменён.");
      event.currentTarget.reset();
      if (data.reauth) {
        window.location.assign("/login");
        return;
      }
    } catch (error) { setPasswordError(error instanceof Error ? error.message : "Не удалось изменить пароль."); }
    finally { setPasswordSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="surface-card p-6">
        <div><h2 className="text-xl font-semibold text-zinc-950">Данные аккаунта</h2><p className="mt-1 text-sm text-zinc-500">Контакты и данные торговой точки.</p></div>
        {profileError && <div className="alert-error mt-5">{profileError}</div>}
        {profileSuccess && <div className="alert-success mt-5">{profileSuccess}</div>}
        <div className="mt-5 space-y-4">
          <label className="block"><span className="field-label">Имя</span><input className="input" name="name" defaultValue={initialName} required minLength={2} maxLength={100} autoComplete="name" /></label>
          <label className="block"><span className="field-label">Название магазина</span><input className="input" name="shopName" defaultValue={initialShopName} required minLength={2} maxLength={150} autoComplete="organization" /></label>
          <label className="block"><span className="field-label">Телефон</span><input className="input" name="phone" type="tel" defaultValue={initialPhone} placeholder="+7 999 000-00-00" required autoComplete="tel" /><span className="mt-2 block text-xs text-zinc-500">После изменения вход выполняется по новому номеру.</span></label>
          {hasStore && <>
            <label className="block"><span className="field-label">Адрес магазина</span><input className="input" name="address" defaultValue={initialAddress} required minLength={4} maxLength={250} autoComplete="street-address" /></label>
            <LocationPicker initialLatitude={initialLatitude} initialLongitude={initialLongitude} required />
          </>}
        </div>
        <button className="button-primary mt-5 w-full" type="submit" disabled={profileSubmitting}>{profileSubmitting ? "Сохраняем…" : "Сохранить данные"}</button>
      </form>

      <form onSubmit={changePassword} className="surface-card p-6">
        <div><h2 className="text-xl font-semibold text-zinc-950">Смена пароля</h2><p className="mt-1 text-sm text-zinc-500">Новый пароль должен содержать минимум 8 символов, букву и цифру.</p></div>
        {passwordError && <div className="alert-error mt-5">{passwordError}</div>}
        {passwordSuccess && <div className="alert-success mt-5">{passwordSuccess}</div>}
        <div className="mt-5 space-y-4">
          <label className="block"><span className="field-label">Текущий пароль</span><input className="input" name="currentPassword" type="password" required autoComplete="current-password" /></label>
          <label className="block"><span className="field-label">Новый пароль</span><input className="input" name="newPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" /></label>
          <label className="block"><span className="field-label">Повторите новый пароль</span><input className="input" name="confirmPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" /></label>
        </div>
        <button className="button-secondary mt-5 w-full" type="submit" disabled={passwordSubmitting}>{passwordSubmitting ? "Изменяем…" : "Изменить пароль"}</button>
      </form>
    </div>
  );
}
