import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/uploads";


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT" && session.user.role !== "TA" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const form = await req.formData();
  const title = String(form.get("title") || "");
  const type = String(form.get("type") || "OTHER") ;
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }

  let studentId = String(form.get("studentId") || "");
  if (session.user.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) return NextResponse.json({ error: "学生档案不存在" }, { status: 400 });
    studentId = profile.id;
  } else if (!studentId) {
    return NextResponse.json({ error: "缺少 studentId" }, { status: 400 });
  }

  const saved = await saveUpload(file, `documents/${studentId}`);

  const doc = await prisma.document.create({
    data: {
      studentId,
      uploadedBy: session.user.id,
      type,
      title: title || saved.fileName,
      fileName: saved.fileName,
      filePath: saved.filePath,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
    },
  });

  return NextResponse.json({ ok: true, id: doc.id });
}
