"use client";

import { useState } from "react";

export function LogoutButton({ className = "button-secondary" }: { className?: string }) {
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

  return (
    <button type="button" className={className} onClick={() => void logout()} disabled={loading}>
      {loading ? "Выходим…" : "Выйти"}
    </button>
  );
}
