import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile } from "fs/promises";
import { authOptions } from "@/lib/auth";
import { canDownloadDocument } from "@/lib/access";
import { absoluteUploadPath } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { ok, doc } = await canDownloadDocument(session.user, params.id);
  if (!ok || !doc) {
    return NextResponse.json({ error: "无权限或不存在" }, { status: 403 });
  }
  try {
    const buf = await readFile(absoluteUploadPath(doc.filePath));
    return new NextResponse(buf, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}
