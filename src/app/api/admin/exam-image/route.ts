import { isAdminRequest } from "@/lib/guards";
import { saveImage } from "@/lib/exam/uploads";

/** Admin uploads a chart image for the weekly exam. */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) return Response.json({ ok: false, message: "Admins only." }, { status: 403 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ ok: false, message: "No file received." }, { status: 400 });
  const r = await saveImage(file);
  return Response.json(r, { status: r.ok ? 200 : 400 });
}
