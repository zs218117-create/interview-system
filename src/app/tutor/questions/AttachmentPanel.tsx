"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, btnSecondary, inputClass } from "@/components/forms/FormBits";
import { VoiceTextArea } from "@/components/voice/VoiceTextArea";

type Att = {
  id: string;
  fileName: string;
  kind: string;
  extractStatus: string;
  extractedText: string | null;
  extractError: string | null;
  parentId: string | null;
  sizeBytes: number | null;
};

export function AttachmentPanel({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [list, setList] = useState<Att[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function refresh() {
    const res = await fetch(`/api/questions/${questionId}/attachments`);
    if (res.ok) setList(await res.json());
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setMsg("请选择文件");
      return;
    }
    setLoading(true);
    setMsg("上传并解析中…");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/questions/${questionId}/attachments`, {
      method: "POST",
      body: fd,
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "上传失败");
      return;
    }
    setFile(null);
    setMsg("上传成功");
    await refresh();
    router.refresh();
  }

  async function reExtract(id: string) {
    setMsg("重新识别中…");
    const res = await fetch(`/api/attachments/${id}/extract`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "识别失败");
      return;
    }
    setMsg("识别完成");
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("确定删除该附件？")) return;
    await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    await refresh();
    router.refresh();
  }

  async function saveText(id: string, apply: boolean) {
    const res = await fetch(`/api/attachments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extractedText: editText, applyToQuestion: apply }),
    });
    if (!res.ok) {
      setMsg("保存失败");
      return;
    }
    setMsg(apply ? "已写入题目内容" : "已保存提取文本");
    setEditingId(null);
    await refresh();
    router.refresh();
  }

  const roots = list.filter((a) => !a.parentId);
  const childrenOf = (id: string) => list.filter((a) => a.parentId === id);

  return (
    <div className="space-y-4" id="attachment-panel">
      <form onSubmit={onUpload} className="space-y-2 rounded-lg border border-dashed border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-700">上传题目材料</p>
        <p className="text-xs text-slate-500">
          支持 PDF / Word / Markdown / 图片（OCR）/ zip、tar.gz。压缩包会安全解压并逐个识别。
        </p>
        <input
          type="file"
          className="w-full text-sm"
          accept=".pdf,.doc,.docx,.md,.markdown,.png,.jpg,.jpeg,.webp,.gif,.zip,.tar,.gz,.tgz"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? "处理中…" : "上传并提取文字"}
        </button>
      </form>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}

      {!roots.length ? (
        <p className="text-sm text-slate-400">暂无附件</p>
      ) : (
        <ul className="space-y-3">
          {roots.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-100 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {a.fileName}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      {a.kind} · {a.extractStatus}
                      {a.sizeBytes != null ? ` · ${Math.round(a.sizeBytes / 1024)}KB` : ""}
                    </span>
                  </p>
                  {a.extractError && (
                    <p className="text-xs text-red-600">{a.extractError}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <a className={btnSecondary} href={`/api/attachments/${a.id}/download`}>
                    下载
                  </a>
                  {a.kind !== "ARCHIVE" && (
                    <button type="button" className={btnSecondary} onClick={() => reExtract(a.id)}>
                      重新识别
                    </button>
                  )}
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => {
                      setEditingId(a.id);
                      setEditText(a.extractedText || "");
                    }}
                  >
                    预览/编辑文本
                  </button>
                  <button type="button" className={btnSecondary} onClick={() => remove(a.id)}>
                    删除
                  </button>
                </div>
              </div>
              {editingId === a.id && (
                <div className="mt-3 space-y-2">
                  <VoiceTextArea rows={8} value={editText} onChange={setEditText} />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={btnPrimary} onClick={() => saveText(a.id, false)}>
                      保存提取文本
                    </button>
                    <button type="button" className={btnSecondary} onClick={() => saveText(a.id, true)}>
                      应用到题目内容
                    </button>
                    <button type="button" className={btnSecondary} onClick={() => setEditingId(null)}>
                      关闭
                    </button>
                  </div>
                </div>
              )}
              {childrenOf(a.id).length > 0 && (
                <ul className="mt-2 space-y-2 border-l-2 border-slate-100 pl-3">
                  {childrenOf(a.id).map((c) => (
                    <li key={c.id} className="text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {c.fileName} · {c.kind} · {c.extractStatus}
                        </span>
                        <span className="flex gap-1">
                          <button type="button" className={btnSecondary} onClick={() => reExtract(c.id)}>
                            重新识别
                          </button>
                          <button
                            type="button"
                            className={btnSecondary}
                            onClick={() => {
                              setEditingId(c.id);
                              setEditText(c.extractedText || "");
                            }}
                          >
                            文本
                          </button>
                          <button type="button" className={btnSecondary} onClick={() => remove(c.id)}>
                            删
                          </button>
                        </span>
                      </div>
                      {editingId === c.id && (
                        <div className="mt-2 space-y-2">
                          <textarea
                            className={inputClass}
                            rows={6}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button type="button" className={btnPrimary} onClick={() => saveText(c.id, false)}>
                              保存
                            </button>
                            <button type="button" className={btnSecondary} onClick={() => saveText(c.id, true)}>
                              应用到题目
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
