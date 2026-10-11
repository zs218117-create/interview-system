import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "TUTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { name: true } } },
  });
  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "TUTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const body = await req.json();
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  if (!title || !content) {
    return NextResponse.json({ error: "标题和内容必填" }, { status: 400 });
  }
  const q = await prisma.question.create({
    data: {
      title,
      content,
      subject: body.subject ? String(body.subject) : null,
      difficulty: body.difficulty ? String(body.difficulty) : null,
      createdById: session.user.id,
      isTemplate: body.isTemplate !== false,
    },
  });
  return NextResponse.json({ ok: true, id: q.id });
}
