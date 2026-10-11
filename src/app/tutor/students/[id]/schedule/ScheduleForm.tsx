"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass, btnPrimary } from "@/components/forms/FormBits";
import { VoiceInput } from "@/components/voice/VoiceInput";

type Q = { id: string; title: string; subject: string | null };

export function ScheduleForm({
  studentId,
  studentName,
  questions,
  defaultTutorId,
}: {
  studentId: string;
  studentName: string;
  questions: Q[];
  defaultTutorId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(`${studentName} · 个性化面试`);
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [meetingUrl, setMeetingUrl] = useState("https://meeting.tencent.com/dm/");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMin,
        meetingUrl,
        notes,
        questionIds: selected,
        tutorIds: [defaultTutorId],
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "创建失败");
      return;
    }
    router.push(`/tutor/students/${studentId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="面试标题">
        <VoiceInput value={title} onChange={setTitle} required />
      </Field>
      <Field label="开始时间">
        <input
          type="datetime-local"
          className={inputClass}
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="时长（分钟）">
          <input
            type="number"
            min={15}
            max={120}
            className={inputClass}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
          />
        </Field>
        <Field label="腾讯会议链接">
          <VoiceInput type="url" value={meetingUrl} onChange={setMeetingUrl} />
        </Field>
      </div>
      <Field label="备注">
        <VoiceInput
          value={notes}
          onChange={setNotes}
          placeholder="如：常规 20 + 个性化 10"
        />
      </Field>
      <Field label="选题（可多选）">
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
          {!questions.length ? (
            <p className="text-sm text-slate-400">题库为空，请先去「题库」创建</p>
          ) : (
            questions.map((q) => (
              <label key={q.id} className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(q.id)}
                  onChange={() => toggle(q.id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">{q.title}</span>
                  {q.subject ? <span className="text-slate-400"> · {q.subject}</span> : null}
                </span>
              </label>
            ))
          )}
        </div>
      </Field>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "安排中…" : "确认安排面试"}
      </button>
    </form>
  );
}
