"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass, btnPrimary } from "@/components/forms/FormBits";

type UploadStatus = { name: string; state: "pending" | "uploading" | "ok" | "fail"; error?: string };

export function QuestionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("数学");
  const [difficulty, setDifficulty] = useState("B");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setUploadStatuses(files.map((f) => ({ name: f.name, state: "pending" })));

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, subject, difficulty }),
    });
    if (!res.ok) {
      setLoading(false);
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "创建失败");
      return;
    }
    const data = await res.json();
    const questionId = data.id as string;
    setMsg("题目已创建，正在上传附件…");

    let failCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, state: "uploading" } : s))
      );
      const fd = new FormData();
      fd.append("file", file);
      try {
        const up = await fetch(`/api/questions/${questionId}/attachments`, {
          method: "POST",
          body: fd,
        });
        if (!up.ok) {
          const d = await up.json().catch(() => ({}));
          failCount += 1;
          setUploadStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, state: "fail", error: d.error || "上传失败" } : s
            )
          );
        } else {
          setUploadStatuses((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, state: "ok" } : s))
          );
        }
      } catch {
        failCount += 1;
        setUploadStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, state: "fail", error: "网络错误" } : s
          )
        );
      }
    }

    setLoading(false);
    if (files.length === 0) {
      setMsg("已创建");
    } else if (failCount === 0) {
      setMsg(`已创建，${files.length} 个附件上传并解析完成`);
    } else {
      setMsg(`题目已创建；${files.length - failCount} 成功，${failCount} 失败（可在详情页重试）`);
    }

    setTitle("");
    setContent("");
    setFiles([]);
    router.push(`/tutor/questions/${questionId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" id="create-question-form">
      <Field label="题目标题">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Field>
      <Field label="题目内容">
        <textarea
          className={inputClass}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
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

      <Field label="附件（可选，可多选）">
        <input
          type="file"
          multiple
          className="w-full text-sm"
          accept=".pdf,.doc,.docx,.md,.markdown,.png,.jpg,.jpeg,.webp,.gif,.zip,.tar,.gz,.tgz"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        <p className="mt-1 text-xs text-slate-500">
          支持 PDF / Word / Markdown / 图片 / zip、tar.gz。提交后先创建题目，再自动上传并提取文字。
        </p>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {files.map((f) => (
              <li key={f.name + f.size}>
                {f.name}（{Math.round(f.size / 1024)} KB）
              </li>
            ))}
          </ul>
        )}
      </Field>

      {uploadStatuses.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
          {uploadStatuses.map((s) => (
            <li key={s.name} className="flex justify-between gap-2">
              <span className="truncate">{s.name}</span>
              <span
                className={
                  s.state === "ok"
                    ? "text-green-700"
                    : s.state === "fail"
                      ? "text-red-600"
                      : s.state === "uploading"
                        ? "text-indigo-600"
                        : "text-slate-400"
                }
              >
                {s.state === "pending" && "等待"}
                {s.state === "uploading" && "上传解析中…"}
                {s.state === "ok" && "完成"}
                {s.state === "fail" && (s.error || "失败")}
              </span>
            </li>
          ))}
        </ul>
      )}

      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "创建并上传中…" : files.length ? `创建题目并上传 ${files.length} 个附件` : "创建题目"}
      </button>
    </form>
  );
}
