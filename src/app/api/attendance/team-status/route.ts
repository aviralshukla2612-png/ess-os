import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: true,
        statusEvents: {
          where: { 
            endedAt: null, 
            statusType: { in: ["WORKING", "BREAK", "Lunch", "Tea", "LUNCH", "TEA_BREAK"] } 
          },
          orderBy: { startedAt: "desc" },
          take: 1
        },
        workSessions: {
          where: { endedAt: null },
          include: { project: true, task: true },
          orderBy: { startedAt: "desc" },
          take: 1
        }
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const teamData = employees.map((emp) => {
        // Use included relations instead of separate queries (Fixes N+1)
        const activeBreak = emp.statusEvents?.find(e => e.statusType !== "WORKING") || null;
        const workingEvent = emp.statusEvents?.find(e => e.statusType === "WORKING") || null;
        const activeWork = emp.workSessions?.[0] || null;

        // Determine status
        let status = "WORKING";
        let statusColor = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
        let task = "General Work";
        let project = "Internal";
        let duration = "Active";

        if (activeBreak) {
          status = activeBreak.statusType === "Lunch" || activeBreak.statusType === "LUNCH" ? "LUNCH" : "ON_BREAK";
          statusColor = "bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800";
          task = activeBreak.notes ? `Reason: ${activeBreak.notes}` : "On Break";
          const startMs = new Date(activeBreak.startedAt).getTime();
          const nowMs = Date.now();
          const mins = Math.round((nowMs - startMs) / 60000);
          duration = `${mins}m`;
        } else if (activeWork || workingEvent) {
          status = "WORKING";
          if (activeWork?.project) project = activeWork.project.name;
          if (activeWork?.task) task = `Task: ${activeWork.task.title}`;
          else if (workingEvent?.notes) task = workingEvent.notes;

          const startMs = new Date((activeWork || workingEvent)!.startedAt).getTime();
          const nowMs = Date.now();
          const hrs = Math.floor((nowMs - startMs) / 3600000);
          const mins = Math.round(((nowMs - startMs) % 3600000) / 60000);
          duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        } else {
          // If neither, maybe not punched in or offline
          status = "OFFLINE";
          statusColor = "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
          task = "Not currently working";
          duration = "-";
        }

        return {
          id: emp.id,
          name: emp.user.name,
          designation: emp.skillsJson ? "Team Member" : "Employee",
          status,
          duration,
          project,
          task,
          avatar: emp.user.avatarUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
          statusColor,
          helpWaiting: false,
        };
      });

    return NextResponse.json({ success: true, data: teamData });
  } catch (error) {
    console.error("Fetch Team Status Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch team status" }, { status: 500 });
  }
}
