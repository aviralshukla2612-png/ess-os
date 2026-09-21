import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

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
    
    // Ensure public/uploads/kyc directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "kyc");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

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
