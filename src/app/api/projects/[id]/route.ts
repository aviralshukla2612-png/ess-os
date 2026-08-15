import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: params.id }, { projectNumber: params.id }] },
      include: {
        client: true,
        tasks: true,
        documents: true,
        changeRequests: true,
        memberships: {
          include: { employee: { include: { user: true } } },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name,
        progressPercentage: body.progressPercentage,
        status: body.status,
        priority: body.priority,
        contractValue: body.contractValue,
      },
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}
