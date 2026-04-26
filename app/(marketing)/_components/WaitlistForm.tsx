"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Status = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Что-то пошло не так. Попробуй ещё раз.");
        return;
      }

      setStatus("success");
      setMessage(
        "Готово! Напишем тебе на почту, как только откроем доступ."
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Сеть не отвечает. Проверь соединение и попробуй ещё раз.");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        {message}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row"
      noValidate
    >
      <Input
        type="email"
        name="email"
        required
        placeholder="ты@почта.ру"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={status === "loading"}
        autoComplete="email"
        className="flex-1"
        aria-label="Электронная почта"
      />
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Отправляем..." : "В waitlist"}
      </Button>
      {status === "error" && (
        <p className="basis-full text-sm text-red-400 sm:order-last">
          {message}
        </p>
      )}
    </form>
  );
}
