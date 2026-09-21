import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME_TYPES: { [ext: string]: string } = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const rawSegments = params.path || [];
    if (rawSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const uploadsBaseDir = path.resolve(process.cwd(), "public", "uploads");
    const sanitizedSegments = rawSegments.map((s) => path.basename(s));
    const targetFilePath = path.resolve(uploadsBaseDir, ...sanitizedSegments);

    // Prevent directory traversal attacks
    if (!targetFilePath.startsWith(uploadsBaseDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(targetFilePath)) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(targetFilePath);
    const ext = path.extname(targetFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("GET /api/uploads error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
