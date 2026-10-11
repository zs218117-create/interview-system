import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function saveUpload(
  file: File,
  subdir: string
): Promise<{ fileName: string; filePath: string; sizeBytes: number; mimeType: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fa5]/g, "_");
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const abs = path.join(dir, storedName);
  await writeFile(abs, bytes);
  return {
    fileName: file.name,
    filePath: path.join(subdir, storedName).replace(/\\/g, "/"),
    sizeBytes: bytes.length,
    mimeType: file.type || "application/octet-stream",
  };
}

export function absoluteUploadPath(relative: string) {
  return path.join(UPLOAD_ROOT, relative);
}
