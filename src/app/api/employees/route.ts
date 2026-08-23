import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

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
        workHours: `${Math.floor((a.totalMinutes || 0) / 60)}h ${(a.totalMinutes || 0) % 60}m`,
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ success: false, error: "Missing required fields: name, email, password" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 });
    }

    const count = await prisma.employee.count();
    const code = `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: body.email,
          passwordHash: hashedPassword,
          name: body.name,
          designation: body.designation || "Team Member",
          department: body.department || "General",
          activeRole: "EMPLOYEE", // FORCE ROLE TO EMPLOYEE
          avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + count * 100}?w=150`,
        },
      });

      const newEmployee = await tx.employee.create({
        data: {
          userId: newUser.id,
          employeeIdCode: code,
          salaryMonthly: body.salaryMonthly || 0,
          skillsJson: JSON.stringify(body.skills || []),
        },
      });

      return { user: newUser, employee: newEmployee };
    });

    const { passwordHash, ...safeUser } = result.user;

    return NextResponse.json({ success: true, data: { id: result.employee.id, code, user: safeUser } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create employee" }, { status: 500 });
  }
}
