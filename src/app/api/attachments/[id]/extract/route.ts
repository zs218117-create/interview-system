import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absoluteUploadPath } from "@/lib/uploads";
import { extractTextFromFile } from "@/lib/questions/extractText";
import type { AttachmentKind } from "@/lib/questions/kinds";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "TUTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const att = await prisma.questionAttachment.findUnique({ where: { id: params.id } });
  if (!att) return NextResponse.json({ error: "不存在" }, { status: 404 });
  if (att.kind === "ARCHIVE") {
    return NextResponse.json({ error: "压缩包请对解压后的子文件重新识别" }, { status: 400 });
  }

  await prisma.questionAttachment.update({
    where: { id: att.id },
    data: { extractStatus: "PENDING", extractError: null },
  });

  const abs = absoluteUploadPath(att.filePath);
  const result = await extractTextFromFile(abs, att.fileName, att.kind as AttachmentKind);
  const updated = await prisma.questionAttachment.update({
    where: { id: att.id },
    data: {
      extractedText: result.text || null,
      extractStatus: result.status,
      extractError: result.error || null,
    },
  });
  return NextResponse.json({ ok: true, attachment: updated });
}
