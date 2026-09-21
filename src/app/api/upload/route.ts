import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

function getWritableUploadDir(): string {
  // Candidate 1: prisma/data/uploads/kyc (inside persistent database volume)
  const candidate1 = path.join(process.cwd(), "prisma", "data", "uploads", "kyc");
  try {
    if (!fs.existsSync(candidate1)) {
      fs.mkdirSync(candidate1, { recursive: true });
    }
    fs.accessSync(candidate1, fs.constants.W_OK);
    return candidate1;
  } catch {}

  // Candidate 2: public/uploads/kyc
  const candidate2 = path.join(process.cwd(), "public", "uploads", "kyc");
  try {
    if (!fs.existsSync(candidate2)) {
      fs.mkdirSync(candidate2, { recursive: true });
    }
    fs.accessSync(candidate2, fs.constants.W_OK);
    return candidate2;
  } catch {}

  // Candidate 3: /tmp/uploads/kyc (always writable in Unix/Linux containers)
  const candidate3 = path.join("/tmp", "uploads", "kyc");
  try {
    if (!fs.existsSync(candidate3)) {
      fs.mkdirSync(candidate3, { recursive: true });
    }
    return candidate3;
  } catch {}

  return candidate2;
}

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Limit file size to 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const ext = path.extname(file.name) || ".jpg";
    const filename = `kyc-${authRes.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    const uploadDir = getWritableUploadDir();
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/crmtesting/api/uploads/kyc/${filename}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename,
      size: buffer.length,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to upload file" }, { status: 500 });
  }
}
