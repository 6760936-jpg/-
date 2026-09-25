"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type FeedbackType = "COMPLAINT" | "SUGGESTION";

export function FeedbackForm() {
  const router = useRouter();
  const [type, setType] = useState<FeedbackType>("COMPLAINT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3 || description.trim().length < 5) {
      setError("Заполните тему и описание");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, description }),
      });
      if (!res.ok) {
        const result = (await res.json()) as { error?: string };
        throw new Error(result.error || "Не удалось отправить");
      }
      setTitle("");
      setDescription("");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card space-y-5 p-6">
      <h2 className="text-lg font-semibold">Новое обращение</h2>

      <div>
        <span className="field-label">Тип обращения</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("COMPLAINT")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
              type === "COMPLAINT"
                ? "border-rose-500 bg-rose-50 text-rose-800"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            Жалоба
          </button>
          <button
            type="button"
            onClick={() => setType("SUGGESTION")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
              type === "SUGGESTION"
                ? "border-violet-500 bg-violet-50 text-violet-800"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            Предложение
          </button>
        </div>
      </div>

      <label className="block">
        <span className="field-label">Тема</span>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            type === "COMPLAINT"
              ? "Например: Товар пришёл повреждённым"
              : "Например: Добавьте больше ароматов для дома"
          }
          required
        />
      </label>

      <label className="block">
        <span className="field-label">Описание</span>
        <textarea
          className="input min-h-32"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Опишите подробнее, что случилось или что хотите предложить"
          required
        />
      </label>

      {error && <div className="alert-error">{error}</div>}
      {success && (
        <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          Обращение отправлено. Мы ответим в ближайшее время.
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="button-primary w-full"
      >
        {submitting ? "Отправка..." : "Отправить"}
      </button>
    </form>
  );
}