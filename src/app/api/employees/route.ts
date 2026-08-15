import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        attendances: true,
        workSessions: {
          include: { project: true },
        },
      },
    });

    const formatted = employees.map((e) => ({
      id: e.id,
      employeeId: e.employeeIdCode,
      name: e.user.name,
      email: e.user.email,
      role: e.user.activeRole,
      designation: e.user.designation,
      department: e.user.department,
      phone: "+91 98980 000" + (e.employeeIdCode.length > 3 ? e.employeeIdCode.slice(-2) : "01"),
      punchedIn: e.attendances.some((a) => a.punchIn && !a.punchOut),
      punchInTime: e.attendances[0]?.punchIn ? new Date(e.attendances[0].punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
      todayWorkSeconds: (e.attendances[0]?.totalMinutes || 120) * 60,
      currentProject: e.workSessions[0]?.project?.name || "General Workspace",
      currentTask: e.workSessions[0]?.notes || "Focusing on active tasks",
      assignedProjects: ["PRJ-2026-001"],
      todayTimeline: e.workSessions.map((w) => ({
        id: w.id,
        timeRange: "09:00 AM - 11:00 AM",
        activity: w.notes || "Core development",
        project: w.project?.name || "General",
        duration: `${w.durationMinutes}m`,
      })),
      attendanceRecord: e.attendances.map((a) => ({
        date: new Date(a.date).toLocaleDateString(),
        punchIn: a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
        punchOut: a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "On-Going",
        status: a.status,
        workHours: `${Math.floor(a.totalMinutes / 60)}h ${a.totalMinutes % 60}m`,
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const count = await prisma.employee.count();
    const code = `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const userEmail = body.email || `employee_${Date.now()}_${count}@emperorsmart.com`;

    let user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          passwordHash: "demo123",
          name: body.name || "Team Member",
          designation: body.designation || "Software Engineer",
          department: body.department || "Engineering",
          activeRole: body.role || "EMPLOYEE",
          avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + count * 100}?w=150`,
        },
      });
    }

    let employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          userId: user.id,
          employeeIdCode: code,
          salaryMonthly: body.salaryMonthly || 85000,
          skillsJson: JSON.stringify(body.skills || ["TypeScript", "Next.js", "Node.js"]),
        },
      });
    }

    return NextResponse.json({ success: true, data: { id: employee.id, code, user } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create employee" }, { status: 500 });
  }
}
