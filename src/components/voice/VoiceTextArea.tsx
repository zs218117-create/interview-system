"use client";

import { useRef, useState } from "react";
import { MicButton } from "./MicButton";
import { appendTranscript, useSpeechToText } from "./useSpeechToText";
import { inputClass } from "@/components/forms/FormBits";

type Props = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
  disabled?: boolean;
};

/** 带「语音录入」的多行文本框：可打字，也可点麦克风把识别结果追加进内容。 */
export function VoiceTextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
  required,
  id,
  className,
  disabled,
}: Props) {
  const [interim, setInterim] = useState("");
  const baseRef = useRef(value);
  baseRef.current = value;

  const speech = useSpeechToText({
    lang: "zh-CN",
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        const next = appendTranscript(baseRef.current, transcript);
        baseRef.current = next;
        onChange(next);
        setInterim("");
      } else {
        setInterim(transcript);
      }
    },
  });

  function handleToggle() {
    if (speech.isListening) {
      speech.stop();
      setInterim("");
    } else {
      baseRef.current = value;
      speech.start();
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-end">
        <MicButton
          status={speech.status === "error" ? "error" : speech.status}
          errorMessage={speech.errorMessage}
          onToggle={handleToggle}
        />
      </div>
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={className || inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {speech.isListening && interim && (
          <p className="pointer-events-none absolute bottom-2 left-3 right-3 truncate text-xs text-indigo-400">
            …{interim}
          </p>
        )}
      </div>
      {speech.isListening && (
        <p className="text-[11px] text-slate-500">
          正在听… 说完后再点一次停止；文字会追加到上方，可继续手动修改。
        </p>
      )}
    </div>
  );
}
