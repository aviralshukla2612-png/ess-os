import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const updates = await prisma.clientUpdate.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, designation: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updates.map((u) => ({
        id: u.id,
        title: u.title,
        content: u.content,
        visibility: u.visibility,
        createdAt: u.createdAt,
        formattedDate: new Date(u.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        author: {
          id: u.author.id,
          name: u.author.name,
          designation: u.author.designation,
          avatarUrl: u.author.avatarUrl,
        },
      })),
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/updates error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch updates" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const projectId = params.id;

    if (!body.title || !body.content) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
    }

    const newUpdate = await prisma.clientUpdate.create({
      data: {
        projectId,
        title: body.title.trim(),
        content: body.content.trim(),
        visibility: body.visibility || "CLIENT_VISIBLE",
        authorId: authRes.id,
      },
      include: {
        author: {
          select: { id: true, name: true, designation: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newUpdate.id,
        title: newUpdate.title,
        content: newUpdate.content,
        visibility: newUpdate.visibility,
        createdAt: newUpdate.createdAt,
        formattedDate: new Date(newUpdate.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        author: {
          id: newUpdate.author.id,
          name: newUpdate.author.name,
          designation: newUpdate.author.designation,
          avatarUrl: newUpdate.author.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/updates error:", error);
    return NextResponse.json({ success: false, error: "Failed to post update" }, { status: 500 });
  }
}
