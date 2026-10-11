"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass, btnPrimary } from "@/components/forms/FormBits";
import { VoiceTextArea } from "@/components/voice/VoiceTextArea";
import { VoiceInput } from "@/components/voice/VoiceInput";

type Interview = {
  id: string;
  title: string;
  questions: { questionId: string; question: { id: string; title: string } }[];
};

export function EvaluateForm({
  studentId,
  interviews,
  defaultInterviewId,
}: {
  studentId: string;
  interviews: Interview[];
  defaultInterviewId?: string;
}) {
  const router = useRouter();
  const [interviewId, setInterviewId] = useState(
    defaultInterviewId || interviews[0]?.id || ""
  );
  const [questionId, setQuestionId] = useState("");
  const [content, setContent] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [originalAnswerNotes, setOriginalAnswerNotes] = useState("");
  const [scoreHint, setScoreHint] = useState("");
  const [assignReAnswer, setAssignReAnswer] = useState(true);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const current = useMemo(
    () => interviews.find((i) => i.id === interviewId),
    [interviews, interviewId]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interviewId,
        questionId: questionId || null,
        content,
        strengths,
        improvements,
        originalAnswerNotes,
        scoreHint,
        assignReAnswer,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "提交失败");
      return;
    }
    const data = await res.json();
    router.push(`/tutor/students/${studentId}`);
    router.refresh();
    setMsg(`已保存 ${data.id}`);
  }

  if (!interviews.length) {
    return <p className="text-sm text-slate-500">请先安排面试场次，再填写评价。</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" id="evaluate-form">
      <Field label="面试场次">
        <select
          className={inputClass}
          value={interviewId}
          onChange={(e) => {
            setInterviewId(e.target.value);
            setQuestionId("");
          }}
        >
          {interviews.map((iv) => (
            <option key={iv.id} value={iv.id}>
              {iv.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="关联题目（可选）">
        <select
          className={inputClass}
          value={questionId}
          onChange={(e) => setQuestionId(e.target.value)}
        >
          <option value="">不指定单题</option>
          {(current?.questions || []).map((q) => (
            <option key={q.questionId} value={q.questionId}>
              {q.question.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="现场/首次表现摘要（用于后续对比）">
        <VoiceTextArea
          rows={3}
          value={originalAnswerNotes}
          onChange={setOriginalAnswerNotes}
          placeholder="当时如何推理？卡在哪？提示后如何理解并继续？"
        />
      </Field>
      <Field label="评价正文">
        <VoiceTextArea
          rows={4}
          value={content}
          onChange={setContent}
          required
          placeholder="侧重思考过程：如何展开新想法、独立推理、吸收应用新概念（勿写录取预测）…"
        />
      </Field>
      <Field label="优点">
        <VoiceTextArea rows={2} value={strengths} onChange={setStrengths} />
      </Field>
      <Field label="待改进 / 再次回答要求">
        <VoiceTextArea
          rows={3}
          value={improvements}
          onChange={setImprovements}
          placeholder="再答时请说清推理步骤、概念迁移；可要求解释提示如何帮到他/她"
        />
      </Field>
      <Field label="过程观察短注（可选，非分数）">
        <VoiceInput
          value={scoreHint}
          onChange={setScoreHint}
          placeholder="如：提示后能较快吸收并迁移到新情境"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={assignReAnswer}
          onChange={(e) => setAssignReAnswer(e.target.checked)}
        />
        布置再次回答（学生端会出现任务）
      </label>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "提交中…" : "提交评价"}
      </button>
    </form>
  );
}
