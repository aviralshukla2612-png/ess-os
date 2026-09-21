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

    const sanitizedSegments = rawSegments.map((s) => path.basename(s));

    // Candidate base directories
    const searchBases = [
      path.resolve(process.cwd(), "prisma", "data", "uploads"),
      path.resolve(process.cwd(), "public", "uploads"),
      path.resolve("/tmp", "uploads"),
    ];

    let foundFilePath: string | null = null;

    for (const base of searchBases) {
      const candidatePath = path.resolve(base, ...sanitizedSegments);
      if (candidatePath.startsWith(base) && fs.existsSync(candidatePath)) {
        foundFilePath = candidatePath;
        break;
      }
    }

    if (!foundFilePath) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(foundFilePath);
    const ext = path.extname(foundFilePath).toLowerCase();
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
