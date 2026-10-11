import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAllowedFileName, kindFromFileName } from "@/lib/questions/kinds";
import { extractArchiveSafe } from "@/lib/questions/safeArchive";
import { extractTextFromFile, uploadsQuestionsRoot } from "@/lib/questions/extractText";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const list = await prisma.questionAttachment.findMany({
    where: { questionId: params.id },
    orderBy: { createdAt: "asc" },
    include: { uploader: { select: { name: true } } },
  });
  return NextResponse.json(list);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "TUTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const question = await prisma.question.findUnique({ where: { id: params.id } });
  if (!question) return NextResponse.json({ error: "题目不存在" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }
  if (!isAllowedFileName(file.name)) {
    return NextResponse.json(
      { error: "不支持的文件类型（允许 PDF/Word/MD/图片/zip/tar.gz）" },
      { status: 400 }
    );
  }
  if (file.size > 40 * 1024 * 1024) {
    return NextResponse.json({ error: "文件过大（上限 40MB）" }, { status: 400 });
  }

  const kind = kindFromFileName(file.name);
  const qDir = path.join(uploadsQuestionsRoot(), params.id);
  await mkdir(qDir, { recursive: true });
  const safeBase = file.name.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fa5]/g, "_");
  const stored = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBase}`;
  const abs = path.join(qDir, stored);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(abs, buf);
  const rel = path.join("questions", params.id, stored).replace(/\\/g, "/");

  const attachment = await prisma.questionAttachment.create({
    data: {
      questionId: params.id,
      uploadedById: session.user.id,
      fileName: file.name,
      filePath: rel,
      mimeType: file.type || null,
      sizeBytes: buf.length,
      kind,
      extractStatus: kind === "ARCHIVE" ? "NONE" : "PENDING",
    },
  });

  const createdChildren: string[] = [];

  if (kind === "ARCHIVE") {
    const extractDir = path.join(qDir, `${attachment.id}-extracted`);
    try {
      const files = await extractArchiveSafe(abs, file.name, extractDir);
      for (const f of files) {
        if (!isAllowedFileName(f.relativePath) && !f.relativePath.match(/\.(txt|pdf|docx?|md|png|jpe?g|webp|gif)$/i)) {
          // still register as EXTRACTED/OTHER for listing
        }
        const childKind = kindFromFileName(f.relativePath);
        const childRel = path
          .join("questions", params.id, `${attachment.id}-extracted`, f.relativePath)
          .replace(/\\/g, "/");
        const child = await prisma.questionAttachment.create({
          data: {
            questionId: params.id,
            uploadedById: session.user.id,
            fileName: path.basename(f.relativePath),
            filePath: childRel,
            sizeBytes: f.sizeBytes,
            kind: childKind === "ARCHIVE" ? "OTHER" : childKind === "OTHER" ? "EXTRACTED" : childKind,
            parentId: attachment.id,
            extractStatus: "PENDING",
          },
        });
        createdChildren.push(child.id);
        const extracted = await extractTextFromFile(f.absPath, f.relativePath, childKind);
        await prisma.questionAttachment.update({
          where: { id: child.id },
          data: {
            extractedText: extracted.text || null,
            extractStatus: extracted.status,
            extractError: extracted.error || null,
          },
        });
      }
      await prisma.questionAttachment.update({
        where: { id: attachment.id },
        data: {
          extractStatus: "OK",
          extractedText: `已解压 ${files.length} 个文件`,
        },
      });
    } catch (e) {
      await prisma.questionAttachment.update({
        where: { id: attachment.id },
        data: {
          extractStatus: "FAILED",
          extractError: (e as Error).message,
        },
      });
    }
  } else {
    const extracted = await extractTextFromFile(abs, file.name, kind);
    await prisma.questionAttachment.update({
      where: { id: attachment.id },
      data: {
        extractedText: extracted.text || null,
        extractStatus: extracted.status,
        extractError: extracted.error || null,
      },
    });
  }

  const fresh = await prisma.questionAttachment.findUnique({
    where: { id: attachment.id },
    include: { children: true },
  });

  return NextResponse.json({ ok: true, attachment: fresh, childIds: createdChildren });
}
