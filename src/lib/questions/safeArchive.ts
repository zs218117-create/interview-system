import { mkdir, writeFile, readFile, readdir } from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import * as tar from "tar";

/** 防止 zip-slip：解析后路径必须落在 destRoot 内 */
export function safeJoin(destRoot: string, entryName: string): string | null {
  const normalized = entryName.replace(/\\/g, "/");
  if (normalized.includes("\0")) return null;
  if (path.isAbsolute(normalized)) return null;
  const parts = normalized.split("/").filter((p) => p && p !== ".");
  if (parts.some((p) => p === "..")) return null;
  const abs = path.resolve(destRoot, ...parts);
  const root = path.resolve(destRoot);
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return abs;
}

export type ExtractedFile = {
  relativePath: string;
  absPath: string;
  sizeBytes: number;
};

export async function extractZipSafe(
  zipPath: string,
  destRoot: string
): Promise<ExtractedFile[]> {
  await mkdir(destRoot, { recursive: true });
  const zip = new AdmZip(zipPath);
  const out: ExtractedFile[] = [];
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const target = safeJoin(destRoot, entry.entryName);
    if (!target) continue;
    await mkdir(path.dirname(target), { recursive: true });
    const data = entry.getData();
    await writeFile(target, data);
    out.push({
      relativePath: path.relative(destRoot, target).replace(/\\/g, "/"),
      absPath: target,
      sizeBytes: data.length,
    });
  }
  return out;
}

export async function extractTarGzSafe(
  archivePath: string,
  destRoot: string
): Promise<ExtractedFile[]> {
  await mkdir(destRoot, { recursive: true });
  await tar.x({
    file: archivePath,
    cwd: destRoot,
    filter(pathName: string) {
      return safeJoin(destRoot, pathName) !== null;
    },
  });
  const out: ExtractedFile[] = [];
  async function walk(dir: string, base: string) {
    const ents = await readdir(dir, { withFileTypes: true });
    for (const e of ents) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) await walk(abs, base);
      else {
        const buf = await readFile(abs);
        out.push({
          relativePath: path.relative(base, abs).replace(/\\/g, "/"),
          absPath: abs,
          sizeBytes: buf.length,
        });
      }
    }
  }
  await walk(destRoot, destRoot);
  return out;
}

export async function extractArchiveSafe(
  archivePath: string,
  fileName: string,
  destRoot: string
): Promise<ExtractedFile[]> {
  const n = fileName.toLowerCase();
  if (n.endsWith(".zip")) return extractZipSafe(archivePath, destRoot);
  if (n.endsWith(".tar.gz") || n.endsWith(".tgz") || n.endsWith(".tar")) {
    return extractTarGzSafe(archivePath, destRoot);
  }
  throw new Error("不支持的压缩格式");
}
