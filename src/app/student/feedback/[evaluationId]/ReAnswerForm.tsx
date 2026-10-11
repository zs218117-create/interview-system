"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, btnPrimary } from "@/components/forms/FormBits";
import { VoiceTextArea } from "@/components/voice/VoiceTextArea";

export function ReAnswerForm({
  evaluationId,
  initial,
}: {
  evaluationId: string;
  initial?: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initial || "");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/reanswers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluationId, content }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "提交失败");
      return;
    }
    setMsg("已提交");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" id="reanswer-form">
      <Field label="你的再次回答（文字）">
        <VoiceTextArea
          rows={8}
          value={content}
          onChange={setContent}
          required
          placeholder="根据导师反馈，重新完整作答…"
        />
      </Field>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "提交中…" : initial ? "更新再次回答" : "提交再次回答"}
      </button>
    </form>
  );
}
