"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { inputClass, btnPrimary } from "@/components/forms/FormBits";

export function UploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("PERSONAL_STATEMENT");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setMsg("请选择文件");
      return;
    }
    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("title", title || file.name);
    fd.append("type", type);
    fd.append("file", file);
    const res = await fetch("/api/documents", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || "上传失败");
      return;
    }
    setTitle("");
    setFile(null);
    setMsg("上传成功");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm text-slate-600">标题</label>
        <VoiceInput value={title} onChange={setTitle} placeholder="如：个人陈述第一稿" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">类型</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputClass}
        >
          <option value="PERSONAL_STATEMENT">个人陈述 (PS)</option>
          <option value="EPQ">EPQ</option>
          <option value="CV">简历</option>
          <option value="TRANSCRIPT">成绩单</option>
          <option value="OTHER">其他</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">文件</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        />
      </div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "上传中…" : "上传"}
      </button>
    </form>
  );
}
