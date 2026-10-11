"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, btnPrimary } from "@/components/forms/FormBits";
import { VoiceTextArea } from "@/components/voice/VoiceTextArea";

export function CompareNotesForm({
  evaluationId,
  initial,
}: {
  evaluationId: string;
  initial: string;
}) {
  const router = useRouter();
  const [compareNotes, setCompareNotes] = useState(initial);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/evaluations/${evaluationId}/compare`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compareNotes }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "保存失败");
      return;
    }
    setMsg("改进备注已保存");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" id="compare-form">
      <Field label="对比后的改进备注">
        <VoiceTextArea
          rows={4}
          value={compareNotes}
          onChange={setCompareNotes}
          required
          placeholder="第二次回答相比第一次有何进步？还缺什么？"
        />
      </Field>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "保存中…" : "保存改进备注"}
      </button>
    </form>
  );
}
