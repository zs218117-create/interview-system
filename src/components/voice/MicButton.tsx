"use client";

import type { SpeechStatus } from "./useSpeechToText";

export function MicButton({
  status,
  errorMessage,
  onToggle,
  compact,
}: {
  status: SpeechStatus;
  errorMessage?: string;
  onToggle: () => void;
  compact?: boolean;
}) {
  const unsupported = status === "unsupported";
  const listening = status === "listening";

  return (
    <div className={compact ? "inline-flex flex-col items-end gap-0.5" : "flex flex-col items-end gap-1"}>
      <button
        type="button"
        onClick={onToggle}
        disabled={unsupported}
        title={
          unsupported
            ? "浏览器不支持语音录入"
            : listening
              ? "点击停止"
              : "语音录入"
        }
        aria-label={listening ? "停止语音录入" : "语音录入"}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
          unsupported
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            : listening
              ? "border-red-300 bg-red-50 text-red-700 shadow-sm ring-2 ring-red-200"
              : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        }`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            listening ? "animate-pulse bg-red-500" : unsupported ? "bg-slate-300" : "bg-indigo-500"
          }`}
        />
        {unsupported ? "不支持语音" : listening ? "正在听…" : "语音录入"}
      </button>
      {(errorMessage || unsupported) && (
        <p className="max-w-[14rem] text-right text-[11px] text-amber-700">
          {unsupported ? "浏览器不支持语音录入（建议 Chrome）" : errorMessage}
        </p>
      )}
    </div>
  );
}
