"use client";

import { useState } from "react";

type Variant = "evaluate" | "observe" | "detail";

const BODY: Record<Variant, { title: string; bullets: string[] }> = {
  evaluate: {
    title: "牛剑面试评价口径（仅供参考，非正式评分表）",
    bullets: [
      "面试看的是：如何思考、如何回应新想法、如何在大纲之外展开讨论——不是「懂多少知识点」。",
      "学生主动求助、在提示下继续推进，通常是正常且被期待的表现；请记录其如何理解与应用提示。",
      "录取证据往往还包括笔试/书面作业、成绩、个人陈述与推荐信；面试只是其中一部分，勿仅凭一场下定论。",
      "请用官方表述描述表现，例如：能否理解并展开新想法、独立思考、吸收并应用新概念。避免用「可教性」等非官方标签。",
      "学院细则因学院而异，勿把某一学院的说法写成全校统一规则。",
      "聚焦推理过程与概念迁移；勿因礼貌、外表等与学术无关因素下判断。",
    ],
  },
  observe: {
    title: "写观察时的提醒（仅供参考）",
    bullets: [
      "记录思考过程：卡在哪、如何自纠、对提示的吸收与迁移，而不是知识点清单。",
      "求助与追问可以是积极信号——写清学生如何利用帮助推进。",
      "用「理解/展开新想法」「独立思考」「吸收应用新概念」等表述；不要写「可教性」作标签。",
      "本条观察可与另一位导师并行，互不覆盖；勿把单次观察写成最终录取判断。",
      "勿评价仪态外表；勿把某一学院做法写成全校规则。",
    ],
  },
  detail: {
    title: "评价提示",
    bullets: [
      "面试侧重思维方式与对新想法的回应，不是背诵量。",
      "写评价/观察时关注：推理过程、提示后的吸收与迁移、独立展开。",
      "面试只是证据之一；勿在此预测录取结果或打「官方分数」。",
    ],
  },
};

export function InterviewGuidanceTips({
  variant = "evaluate",
  defaultOpen = false,
}: {
  variant?: Variant;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { title, bullets } = BODY[variant];

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 text-sm text-amber-950">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs">
            i
          </span>
          {title}
        </span>
        <span className="text-xs text-amber-700">{open ? "收起" : "展开"}</span>
      </button>
      {open && (
        <ul className="space-y-1.5 border-t border-amber-200/80 px-4 py-3 text-xs leading-relaxed text-amber-900/90">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-600" />
              <span>{b}</span>
            </li>
          ))}
          <li className="pt-1 text-[11px] text-amber-700/80">
            以上为教学内部参考提示，不能替代官方招生说明，亦不构成录取预测。
          </li>
        </ul>
      )}
    </div>
  );
}
