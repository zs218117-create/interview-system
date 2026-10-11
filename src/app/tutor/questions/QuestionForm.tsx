"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass, btnPrimary } from "@/components/forms/FormBits";
import { VoiceTextArea } from "@/components/voice/VoiceTextArea";
import { VoiceInput } from "@/components/voice/VoiceInput";

export function QuestionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("数学");
  const [difficulty, setDifficulty] = useState("B");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, subject, difficulty }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "创建失败");
      return;
    }
    setTitle("");
    setContent("");
    setMsg("已创建");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="题目标题">
        <VoiceInput value={title} onChange={setTitle} required />
      </Field>
      <Field label="题目内容">
        <VoiceTextArea rows={4} value={content} onChange={setContent} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="科目">
          <select className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option>数学</option>
            <option>物理</option>
            <option>化学</option>
            <option>综合</option>
          </select>
        </Field>
        <Field label="难度">
          <select className={inputClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </Field>
      </div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "提交中…" : "创建题目"}
      </button>
    </form>
  );
}
