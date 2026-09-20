"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Step = "phone" | "code" | "password" | "done";

type ApiResult = {
  error?: string;
  message?: string;
  testCode?: string;
  resetToken?: string;
  login?: string;
  retryAfter?: number;
};

export function PasswordRecoveryForm() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [login, setLogin] = useState("");
  const [testCode, setTestCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await response.json()) as ApiResult;
      if (!response.ok) {
        if (typeof data.retryAfter === "number") setCountdown(data.retryAfter);
        throw new Error(data.error ?? "Не удалось отправить код.");
      }

      setMessage(data.message ?? "Код отправлен.");
      setTestCode(data.testCode ?? "");
      setCountdown(data.retryAfter ?? 60);
      setStep("code");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось отправить код.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await response.json()) as ApiResult;
      if (!response.ok) throw new Error(data.error ?? "Не удалось проверить код.");

      setResetToken(data.resetToken ?? "");
      setLogin(data.login ?? phone);
      setMessage(data.message ?? "Номер подтверждён.");
      setStep("password");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось проверить код.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    try {
      const response = await fetch("/api/auth/recovery/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
      });
      const data = (await response.json()) as ApiResult;
      if (!response.ok) throw new Error(data.error ?? "Не удалось изменить пароль.");

      setLogin(data.login ?? login);
      setMessage(data.message ?? "Доступ восстановлен.");
      setStep("done");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось изменить пароль.");
    } finally {
      setSubmitting(false);
    }
  }

  function startAgain() {
    setStep("phone");
    setCode("");
    setResetToken("");
    setLogin("");
    setTestCode("");
    setMessage("");
    setError("");
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {step === "phone" && (
        <form onSubmit={sendCode} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Номер телефона</span>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+7 999 000-00-00"
              required
              autoComplete="tel"
            />
            <span className="mt-2 block text-xs text-slate-500">
              Номер телефона является логином для входа.
            </span>
          </label>

          <button className="button-primary w-full" type="submit" disabled={submitting}>
            {submitting ? "Отправляем…" : "Получить код"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} className="space-y-5">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Код отправлен на <strong className="text-slate-950">{phone}</strong>.
          </div>

          {testCode && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <strong>Тестовый SMS-код:</strong> <span className="font-mono text-lg">{testCode}</span>
              <p className="mt-1 text-xs text-blue-700">На локальном сайте код показывается здесь. После подключения SMS он будет приходить на телефон.</p>
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Код из SMS</span>
            <input
              className="input text-center font-mono text-xl tracking-[0.35em]"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              required
              minLength={6}
              maxLength={6}
              autoComplete="one-time-code"
            />
          </label>

          <button className="button-primary w-full" type="submit" disabled={submitting || code.length !== 6}>
            {submitting ? "Проверяем…" : "Подтвердить номер"}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <button className="font-bold text-blue-600 disabled:text-slate-400" type="button" onClick={() => sendCode()} disabled={submitting || countdown > 0}>
              {countdown > 0 ? `Повторить через ${countdown} сек.` : "Отправить код повторно"}
            </button>
            <button className="font-bold text-slate-500 hover:text-slate-700" type="button" onClick={startAgain}>
              Изменить номер
            </button>
          </div>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={resetPassword} className="space-y-5">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Ваш логин: <strong className="text-slate-950">{login}</strong>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Новый пароль</span>
            <input className="input" name="newPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
            <span className="mt-2 block text-xs text-slate-500">Минимум 8 символов, хотя бы одна буква и одна цифра.</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Повторите новый пароль</span>
            <input className="input" name="confirmPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
          </label>

          <button className="button-primary w-full" type="submit" disabled={submitting}>
            {submitting ? "Сохраняем…" : "Установить новый пароль"}
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="space-y-5 text-center">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Логин для входа: <strong className="text-slate-950">{login}</strong>
          </div>
          <Link className="button-primary block w-full" href="/login">
            Перейти ко входу
          </Link>
        </div>
      )}

      {step !== "done" && (
        <p className="text-center text-sm text-slate-500">
          Вспомнили пароль?{" "}
          <Link className="font-bold text-blue-600 hover:text-blue-700" href="/login">
            Вернуться ко входу
          </Link>
        </p>
      )}
    </div>
  );
}
