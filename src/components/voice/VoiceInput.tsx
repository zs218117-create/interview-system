"use client";

import { useRef, useState } from "react";
import { MicButton } from "./MicButton";
import { appendTranscript, useSpeechToText } from "./useSpeechToText";
import { inputClass } from "@/components/forms/FormBits";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  type?: "text" | "url";
  className?: string;
  disabled?: boolean;
};

/** 带语音录入的单行输入 */
export function VoiceInput({
  value,
  onChange,
  placeholder,
  required,
  id,
  type = "text",
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
      <div className="flex items-center gap-2">
        <input
          id={id}
          type={type}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={`min-w-0 flex-1 ${className || inputClass}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <MicButton
          compact
          status={speech.status === "error" ? "error" : speech.status}
          errorMessage={speech.errorMessage}
          onToggle={handleToggle}
        />
      </div>
      {speech.isListening && interim && (
        <p className="text-[11px] text-indigo-500">识别中：{interim}</p>
      )}
    </div>
  );
}
