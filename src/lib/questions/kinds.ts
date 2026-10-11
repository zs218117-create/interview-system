export type AttachmentKind =
  | "PDF"
  | "WORD"
  | "MARKDOWN"
  | "IMAGE"
  | "ARCHIVE"
  | "EXTRACTED"
  | "OTHER";

const EXT_KIND: Record<string, AttachmentKind> = {
  ".pdf": "PDF",
  ".doc": "WORD",
  ".docx": "WORD",
  ".md": "MARKDOWN",
  ".markdown": "MARKDOWN",
  ".png": "IMAGE",
  ".jpg": "IMAGE",
  ".jpeg": "IMAGE",
  ".webp": "IMAGE",
  ".gif": "IMAGE",
  ".zip": "ARCHIVE",
  ".tar": "ARCHIVE",
  ".gz": "ARCHIVE",
  ".tgz": "ARCHIVE",
};

export function extOf(name: string) {
  const n = name.toLowerCase();
  if (n.endsWith(".tar.gz")) return ".tar.gz";
  const i = n.lastIndexOf(".");
  return i >= 0 ? n.slice(i) : "";
}

export function kindFromFileName(name: string): AttachmentKind {
  const n = name.toLowerCase();
  if (n.endsWith(".tar.gz") || n.endsWith(".tgz")) return "ARCHIVE";
  return EXT_KIND[extOf(name)] || "OTHER";
}

export const ALLOWED_EXT = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".md",
  ".markdown",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".zip",
  ".tar",
  ".gz",
  ".tgz",
  ".tar.gz",
]);

export function isAllowedFileName(name: string) {
  const n = name.toLowerCase();
  if (n.endsWith(".tar.gz") || n.endsWith(".tgz")) return true;
  return ALLOWED_EXT.has(extOf(name));
}
