import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile } from "fs/promises";
import { authOptions } from "@/lib/auth";
import { canDownloadRecord } from "@/lib/access";
import { absoluteUploadPath } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { ok, record } = await canDownloadRecord(session.user, params.id);
  if (!ok || !record) {
    return NextResponse.json({ error: "无权限或不存在" }, { status: 403 });
  }
  if (record.externalUrl && !record.filePath) {
    return NextResponse.redirect(record.externalUrl);
  }
  if (!record.filePath) {
    return NextResponse.json({ error: "无文件" }, { status: 404 });
  }
  try {
    const buf = await readFile(absoluteUploadPath(record.filePath));
    const name = record.title || "record";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}
