"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, btnPrimary } from "@/components/forms/FormBits";
import { VoiceTextArea } from "@/components/voice/VoiceTextArea";
import { InterviewGuidanceTips } from "@/components/guidance/InterviewGuidanceTips";

export function ObservationForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, content }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "失败");
      return;
    }
    setContent("");
    setMsg("已添加观察");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <InterviewGuidanceTips variant="observe" />
      <Field label="写一条观察">
        <VoiceTextArea
          rows={3}
          value={content}
          onChange={setContent}
          required
          placeholder="记录推理过程、对提示的吸收与迁移；可与另一位导师并行，互不覆盖"
        />
      </Field>
      {msg && <p className="text-xs text-slate-500">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "提交中…" : "添加观察"}
      </button>
    </form>
  );
}
