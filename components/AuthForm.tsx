"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LocationPicker } from "@/components/LocationPicker";

type AuthFormProps = { mode: "login" | "register"; nextPath?: string };

export function AuthForm({ mode, nextPath = "/profile" }: AuthFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Не удалось выполнить запрос.");
      window.location.href = nextPath.startsWith("/") ? nextPath : "/profile";
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось выполнить запрос.");
    } finally {
      setSubmitting(false);
    }
  }

  const isRegister = mode === "register";
  return (
    <form onSubmit={submit} className="surface-card space-y-5 p-6 sm:p-8">
      {error && <div className="alert-error">{error}</div>}
      {isRegister && (
        <>
          <label className="block"><span className="field-label">Ваше имя</span><input className="input" name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
          <label className="block"><span className="field-label">Название магазина</span><input className="input" name="shopName" required minLength={2} maxLength={150} autoComplete="organization" /></label>
          <label className="block"><span className="field-label">Адрес магазина</span><input className="input" name="address" required minLength={4} maxLength={250} autoComplete="street-address" placeholder="Населённый пункт, улица, дом" /></label>
          <LocationPicker required />
          <label className="block">
            <span className="field-label">Номер полки</span>
            <input className="input uppercase" name="shelfCode" placeholder="Например, P-0007" maxLength={32} />
            <span className="mt-2 block text-xs text-zinc-500">Если наша полка уже установлена, укажите её номер. Если полки нет — оставьте поле пустым.</span>
          </label>
        </>
      )}
      <label className="block"><span className="field-label">Телефон</span><input className="input" name="phone" type="tel" placeholder="+7 999 000-00-00" required autoComplete="tel" /></label>
      <label className="block"><span className="field-label">Пароль</span><input className="input" name="password" type="password" required minLength={8} maxLength={72} autoComplete={isRegister ? "new-password" : "current-password"} />{isRegister && <span className="mt-2 block text-xs text-zinc-500">Минимум 8 символов, буква и цифра.</span>}</label>
      {!isRegister && <div className="text-right"><Link className="link-accent text-sm font-semibold" href="/forgot-password">Забыли пароль?</Link></div>}
      <button className="button-primary w-full" type="submit" disabled={submitting}>{submitting ? "Подождите…" : isRegister ? "Зарегистрировать магазин" : "Войти"}</button>
      <p className="text-center text-sm text-zinc-500">{isRegister ? "Уже зарегистрированы?" : "Нет аккаунта?"} <Link className="link-accent font-semibold" href={`${isRegister ? "/login" : "/register"}?next=${encodeURIComponent(nextPath)}`}>{isRegister ? "Войти" : "Зарегистрироваться"}</Link></p>
    </form>
  );
}
