import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

/**
 * Where uploaded exam images live: UPLOAD_DIR if set, otherwise an "uploads" folder
 * next to the database file (on the server that is the data folder, which deploys
 * never touch), otherwise data/uploads in the project.
 */
export function uploadDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  const db = (process.env.DATABASE_URL || "").replace(/^file:/, "");
  if (db && path.isAbsolute(db)) return path.join(path.dirname(db), "uploads");
  return path.join(process.cwd(), "data", "uploads");
}

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const NAME = /^[a-f0-9]{24}\.(png|jpg|webp)$/;

/** Check the file really is a PNG, JPEG or WebP by its first bytes (not just its declared type). */
function sniff(b: Buffer): string | null {
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function saveImage(file: File): Promise<{ ok: true; name: string } | { ok: false; message: string }> {
  if (!TYPES[file.type]) return { ok: false, message: "Please upload a PNG, JPG or WebP image." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, message: "The image is larger than 3 MB." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return { ok: false, message: "That file is not a valid image." };
  const name = `${crypto.randomBytes(12).toString("hex")}.${ext}`;
  await fs.mkdir(uploadDir(), { recursive: true });
  await fs.writeFile(path.join(uploadDir(), name), buf);
  return { ok: true, name };
}

export async function readImage(name: string): Promise<{ data: Buffer; type: string } | null> {
  if (!NAME.test(name)) return null;
  try {
    const data = await fs.readFile(path.join(uploadDir(), name));
    const ext = name.split(".").pop()!;
    return { data, type: ext === "jpg" ? "image/jpeg" : `image/${ext}` };
  } catch {
    return null;
  }
}

export const imageUrl = (name: string) => `/api/exam-image/${name}`;
