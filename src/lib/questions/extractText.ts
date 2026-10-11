import { readFile, access } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import mammoth from "mammoth";
import { kindFromFileName, type AttachmentKind } from "./kinds";

const execFileAsync = promisify(execFile);

async function extractPdf(filePath: string): Promise<string> {
  // Prefer poppler if available (Docker Lighthouse)
  try {
    await access("/usr/bin/pdftotext");
    const { stdout } = await execFileAsync("pdftotext", ["-layout", "-enc", "UTF-8", filePath, "-"], {
      maxBuffer: 10 * 1024 * 1024,
    });
    if (stdout?.trim()) return stdout;
  } catch {
    /* fall through */
  }
  try {
    // pdf-parse default export interop
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (b: Buffer) => Promise<{ text: string }>;
    const buf = await readFile(filePath);
    const data = await pdfParse(buf);
    return data.text || "";
  } catch (e) {
    throw new Error(`PDF 解析失败: ${(e as Error).message}`);
  }
}

async function extractWord(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  const result = await mammoth.extractRawText({ buffer: buf });
  return result.value || "";
}

async function extractMarkdown(filePath: string): Promise<string> {
  return (await readFile(filePath, "utf8")) || "";
}

async function extractImageOcr(filePath: string): Promise<string> {
  // Prefer system tesseract (chi_sim+eng) on Lighthouse Docker
  try {
    await access("/usr/bin/tesseract");
    const { stdout } = await execFileAsync(
      "tesseract",
      [filePath, "stdout", "-l", "chi_sim+eng", "--psm", "6"],
      { maxBuffer: 10 * 1024 * 1024 }
    );
    if (stdout?.trim()) return stdout;
  } catch {
    /* fall through to tesseract.js */
  }

  const Tesseract = await import("tesseract.js");
  const result = await Tesseract.recognize(filePath, "chi_sim+eng", {
    logger: () => undefined,
  });
  return result.data.text || "";
}

export async function extractTextFromFile(
  filePath: string,
  fileName: string,
  kind?: AttachmentKind
): Promise<{ text: string; status: "OK" | "FAILED" | "NONE"; error?: string }> {
  const k = kind || kindFromFileName(fileName);
  try {
    let text = "";
    switch (k) {
      case "PDF":
        text = await extractPdf(filePath);
        break;
      case "WORD":
        text = await extractWord(filePath);
        break;
      case "MARKDOWN":
        text = await extractMarkdown(filePath);
        break;
      case "IMAGE":
        text = await extractImageOcr(filePath);
        break;
      case "ARCHIVE":
        return { text: "", status: "NONE" };
      default: {
        // try as text
        if (fileName.toLowerCase().endsWith(".txt")) {
          text = await readFile(filePath, "utf8");
        } else {
          return { text: "", status: "NONE" };
        }
      }
    }
    return { text: text.trim(), status: "OK" };
  } catch (e) {
    return { text: "", status: "FAILED", error: (e as Error).message };
  }
}

export function uploadsQuestionsRoot() {
  return path.join(process.cwd(), "uploads", "questions");
}
