"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnSecondary } from "@/components/forms/FormBits";

export function TaskDoneButton({ taskId, status }: { taskId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  if (status === "DONE") return null;

  async function markDone() {
    setLoading(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button type="button" disabled={loading} className={btnSecondary} onClick={markDone}>
      {loading ? "…" : "我已完成"}
    </button>
  );
}
