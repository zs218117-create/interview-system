"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, btnPrimary } from "@/components/forms/FormBits";
import { VoiceInput } from "@/components/voice/VoiceInput";

export function RecordUploadForm({
  interviews,
}: {
  interviews: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [interviewId, setInterviewId] = useState(interviews[0]?.id || "");
  const [title, setTitle] = useState("");
  const [recordType, setRecordType] = useState("TRANSCRIPT");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!interviewId) {
      setMsg("请选择面试场次");
      return;
    }
    if (!file && !externalUrl.trim()) {
      setMsg("请上传文件或填写链接");
      return;
    }
    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("interviewId", interviewId);
    fd.append("title", title || "面试记录");
    fd.append("recordType", recordType);
    if (externalUrl.trim()) fd.append("externalUrl", externalUrl.trim());
    if (file) fd.append("file", file);
    const res = await fetch("/api/records", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || "上传失败");
      return;
    }
    setTitle("");
    setExternalUrl("");
    setFile(null);
    setMsg("上传成功");
    router.refresh();
  }

  if (!interviews.length) {
    return <p className="text-sm text-slate-500">暂无面试场次可关联</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm text-slate-600">面试场次</label>
        <select
          value={interviewId}
          onChange={(e) => setInterviewId(e.target.value)}
          className={inputClass}
        >
          {interviews.map((iv) => (
            <option key={iv.id} value={iv.id}>
              {iv.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">标题</label>
        <VoiceInput value={title} onChange={setTitle} placeholder="如：转写稿 / 书写照片" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">类型</label>
        <select
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
          className={inputClass}
        >
          <option value="AUDIO">录音</option>
          <option value="TRANSCRIPT">转写</option>
          <option value="WRITING">书写材料</option>
          <option value="LINK">外部链接</option>
          <option value="OTHER">其他</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">外部链接（可选）</label>
        <VoiceInput type="url" value={externalUrl} onChange={setExternalUrl} placeholder="https://..." />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">或上传文件（可选）</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />
      </div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "提交中…" : "提交记录"}
      </button>
    </form>
  );
}
