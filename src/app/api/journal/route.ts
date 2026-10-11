import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  const body = await req.json();
  const content = String(body.content || "").trim();
  if (!content) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 400 });
  }

  const entry = await prisma.journalEntry.create({
    data: {
      studentId: profile.id,
      authorId: session.user.id,
      content,
    },
  });

  return NextResponse.json({ ok: true, id: entry.id });
}
