"use client";

import Link from "next/link";
import { useState } from "react";

export function AuthButton({
  isLoggedIn,
  className = "button-secondary",
}: {
  isLoggedIn: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <Link href="/login" className={className}>
        Войти
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => void logout()}
      disabled={loading}
    >
      {loading ? "Выходим…" : "Выйти"}
    </button>
  );
}