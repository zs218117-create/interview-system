"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@/types/roles";

type NavItem = { href: string; label: string };

const NAV: Record<Role, NavItem[]> = {
  STUDENT: [
    { href: "/student", label: "首页" },
    { href: "/student/profile", label: "我的档案" },
    { href: "/student/documents", label: "资料上传" },
    { href: "/student/schedule", label: "课表与面试" },
    { href: "/student/feedback", label: "反馈与再答" },
    { href: "/student/tasks", label: "我的任务" },
    { href: "/student/journal", label: "每日收获" },
  ],
  TUTOR: [
    { href: "/tutor", label: "首页" },
    { href: "/tutor/students", label: "我的学生" },
    { href: "/tutor/questions", label: "题库" },
  ],
  TA: [
    { href: "/ta", label: "首页" },
    { href: "/ta/students", label: "学生档案" },
    { href: "/ta/records", label: "面试记录" },
    { href: "/ta/tasks", label: "任务与外课" },
  ],
  ADMIN: [{ href: "/admin", label: "管理后台" }],
};

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "学生",
  TUTOR: "导师",
  TA: "助教",
  ADMIN: "管理员",
};

export function AppShell({
  children,
  name,
  role,
}: {
  children: React.ReactNode;
  name: string;
  role: Role;
}) {
  const pathname = usePathname();
  const items = NAV[role] || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold text-indigo-700">
              面试训练管理系统
            </Link>
            <nav className="hidden gap-1 md:flex">
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== `/${role.toLowerCase()}` &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 text-sm ${
                      active
                        ? "bg-indigo-50 font-medium text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">
              {name} · {ROLE_LABEL[role]}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              退出登录
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
