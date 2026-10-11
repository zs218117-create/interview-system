"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRec = SpeechRecognition;

function getSpeechRecognitionCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window &
    typeof globalThis & {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type SpeechStatus = "idle" | "listening" | "unsupported" | "error";

export function useSpeechToText(options?: {
  lang?: string;
  /** 追加到现有文本前的分隔（默认空格或换行由调用方处理） */
  onResult?: (transcript: string, isFinal: boolean) => void;
}) {
  const lang = options?.lang || "zh-CN";
  const onResultRef = useRef(options?.onResult);
  onResultRef.current = options?.onResult;

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef<SpeechRec | null>(null);
  const intentionalStop = useRef(false);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setStatus("listening");
      setErrorMessage("");
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0]?.transcript || "";
        if (r.isFinal) finalChunk += text;
        else interim += text;
      }
      if (finalChunk && onResultRef.current) {
        onResultRef.current(finalChunk, true);
      } else if (interim && onResultRef.current) {
        onResultRef.current(interim, false);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      // aborted / no-speech 在主动停止时常见，不当作硬错误
      if (event.error === "aborted" || event.error === "no-speech") {
        return;
      }
      if (event.error === "not-allowed") {
        setErrorMessage("麦克风权限被拒绝，请在浏览器设置中允许");
      } else {
        setErrorMessage(`语音识别出错：${event.error}`);
      }
      setStatus("error");
    };

    rec.onend = () => {
      if (!intentionalStop.current && recognitionRef.current) {
        // 部分浏览器 continuous 会自动结束，尝试续听
        try {
          recognitionRef.current.start();
          return;
        } catch {
          /* ignore */
        }
      }
      intentionalStop.current = false;
      setStatus((s) => (s === "unsupported" ? s : "idle"));
    };

    recognitionRef.current = rec;

    return () => {
      intentionalStop.current = true;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || !recognitionRef.current) {
      setStatus("unsupported");
      setErrorMessage("浏览器不支持语音录入");
      return;
    }
    intentionalStop.current = false;
    setErrorMessage("");
    try {
      recognitionRef.current.start();
      setStatus("listening");
    } catch {
      // 已在听则忽略
    }
  }, []);

  const stop = useCallback(() => {
    intentionalStop.current = true;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setStatus((s) => (s === "unsupported" ? s : "idle"));
  }, []);

  const toggle = useCallback(() => {
    if (status === "listening") stop();
    else start();
  }, [status, start, stop]);

  return {
    status,
    errorMessage,
    supported: status !== "unsupported",
    isListening: status === "listening",
    start,
    stop,
    toggle,
  };
}

export function appendTranscript(current: string, chunk: string): string {
  const t = chunk.trim();
  if (!t) return current;
  if (!current) return t;
  // 中文一般不需要空格，英文词之间补空格
  const needSpace = /[A-Za-z0-9]$/.test(current) && /^[A-Za-z0-9]/.test(t);
  return current + (needSpace ? " " : "") + t;
}
