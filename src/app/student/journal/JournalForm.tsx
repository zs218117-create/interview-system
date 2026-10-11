"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary } from "@/components/forms/FormBits";
import { VoiceTextArea } from "@/components/voice/VoiceTextArea";

export function JournalForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setLoading(false);
    if (!res.ok) {
      setMsg("保存失败");
      return;
    }
    setContent("");
    setMsg("已保存");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <VoiceTextArea
        rows={5}
        value={content}
        onChange={setContent}
        required
        placeholder="今天学到了什么？哪里还卡着？"
      />
      {msg && <p className="text-sm text-slate-500">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
