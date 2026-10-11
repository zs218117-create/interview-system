import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { unlink, rm } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absoluteUploadPath } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const att = await prisma.questionAttachment.findUnique({
    where: { id: params.id },
    include: { children: true, uploader: { select: { name: true } } },
  });
  if (!att) return NextResponse.json({ error: "不存在" }, { status: 404 });
  return NextResponse.json(att);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "TUTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const att = await prisma.questionAttachment.findUnique({
    where: { id: params.id },
    include: { children: true },
  });
  if (!att) return NextResponse.json({ error: "不存在" }, { status: 404 });

  // delete files best-effort
  try {
    await unlink(absoluteUploadPath(att.filePath));
  } catch { /* ignore */ }
  if (att.kind === "ARCHIVE") {
    const extractDir = absoluteUploadPath(
      path.join(path.dirname(att.filePath), `${att.id}-extracted`)
    );
    try {
      await rm(extractDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }

  await prisma.questionAttachment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "TUTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const body = await req.json();
  const extractedText =
    body.extractedText !== undefined ? String(body.extractedText) : undefined;
  const applyToQuestion = !!body.applyToQuestion;

  const att = await prisma.questionAttachment.findUnique({ where: { id: params.id } });
  if (!att) return NextResponse.json({ error: "不存在" }, { status: 404 });

  const updated = await prisma.questionAttachment.update({
    where: { id: params.id },
    data: {
      ...(extractedText !== undefined ? { extractedText } : {}),
    },
  });

  if (applyToQuestion && (extractedText ?? att.extractedText)) {
    const text = (extractedText ?? att.extractedText) || "";
    await prisma.question.update({
      where: { id: att.questionId },
      data: { content: text },
    });
  }

  return NextResponse.json({ ok: true, attachment: updated });
}
