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
  if (session.user.role !== "TA" && session.user.role !== "TUTOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const form = await req.formData();
  const interviewId = String(form.get("interviewId") || "");
  const title = String(form.get("title") || "面试记录");
  const recordType = String(form.get("recordType") || "OTHER");
  const externalUrl = String(form.get("externalUrl") || "").trim() || null;
  const file = form.get("file");

  if (!interviewId) {
    return NextResponse.json({ error: "缺少面试场次" }, { status: 400 });
  }

  const interview = await prisma.interviewSession.findUnique({
    where: { id: interviewId },
  });
  if (!interview) {
    return NextResponse.json({ error: "面试不存在" }, { status: 404 });
  }

  let filePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    const saved = await saveUpload(file, `records/${interviewId}`);
    filePath = saved.filePath;
  }

  if (!filePath && !externalUrl) {
    return NextResponse.json({ error: "请提供文件或链接" }, { status: 400 });
  }

  const record = await prisma.interviewRecord.create({
    data: {
      interviewId,
      uploadedBy: session.user.id,
      title,
      recordType,
      filePath,
      externalUrl,
    },
  });

  return NextResponse.json({ ok: true, id: record.id });
}
