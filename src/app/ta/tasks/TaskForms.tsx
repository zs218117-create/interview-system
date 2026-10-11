"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass, btnPrimary, btnSecondary } from "@/components/forms/FormBits";
import { VoiceTextArea } from "@/components/voice/VoiceTextArea";
import { VoiceInput } from "@/components/voice/VoiceInput";

type StudentOpt = { id: string; name: string; userId: string };

export function CreateTaskForm({ students }: { students: StudentOpt[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const student = students.find((s) => s.id === studentId);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        title,
        description,
        dueDate: dueDate || null,
        assigneeId: student?.userId,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "失败");
      return;
    }
    setTitle("");
    setDescription("");
    setMsg("任务已创建");
    router.refresh();
  }

  if (!students.length) return <p className="text-sm text-slate-500">暂无负责学生</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-3" id="create-task-form">
      <Field label="学生">
        <select className={inputClass} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="任务标题">
        <VoiceInput value={title} onChange={setTitle} required />
      </Field>
      <Field label="说明">
        <VoiceTextArea rows={2} value={description} onChange={setDescription} />
      </Field>
      <Field label="截止日期">
        <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "创建中…" : "创建任务"}
      </button>
    </form>
  );
}

export function ExternalLessonForm({ students }: { students: StudentOpt[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/external-lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, title, provider, date: date || null, content }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "失败");
      return;
    }
    setTitle("");
    setContent("");
    setMsg("已录入");
    router.refresh();
  }

  if (!students.length) return <p className="text-sm text-slate-500">暂无负责学生</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="学生">
        <select className={inputClass} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="课程标题">
        <VoiceInput value={title} onChange={setTitle} required />
      </Field>
      <Field label="机构/来源">
        <VoiceInput value={provider} onChange={setProvider} />
      </Field>
      <Field label="日期">
        <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="内容摘要">
        <VoiceTextArea rows={3} value={content} onChange={setContent} required />
      </Field>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "提交中…" : "录入外部补习"}
      </button>
    </form>
  );
}

export function TaskStatusButtons({ taskId, status }: { taskId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string) {
    setLoading(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-1">
      {status !== "IN_PROGRESS" && (
        <button type="button" disabled={loading} className={btnSecondary} onClick={() => setStatus("IN_PROGRESS")}>
          进行中
        </button>
      )}
      {status !== "DONE" && (
        <button type="button" disabled={loading} className={btnSecondary} onClick={() => setStatus("DONE")}>
          标为完成
        </button>
      )}
      {status === "DONE" && (
        <button type="button" disabled={loading} className={btnSecondary} onClick={() => setStatus("PENDING")}>
          重开
        </button>
      )}
    </div>
  );
}
