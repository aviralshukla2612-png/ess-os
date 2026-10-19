import { CurrentUserSession } from "@/lib/auth";
import { ATTENDANCE_TOOLS } from "./tools";
import { OllamaClient } from "./ollamaClient";
import { hasAdminAttendanceAccess } from "../attendanceService";
import { getISTDateString } from "../dateUtils";

export interface AnalyticsQueryResponse {
  success: boolean;
  question: string;
  toolUsed: string;
  parameters: Record<string, any>;
  data: any;
  explanation: string;
  source: "ollama" | "fallback";
  metrics?: Array<{ label: string; value: number | string; color?: string }>;
  table?: any[] | null;
  chart?: any[] | null;
  downloadUrl?: string | null;
  reportingPeriod?: {
    date: string;
    timezone: string;
  };
  error?: string;
}

export class AttendanceAnalyticsOrchestrator {
  private static formatStructuredData(toolName: string, rawResult: any) {
    const today = getISTDateString();
    const reportingPeriod = {
      date: today,
      timezone: "Asia/Kolkata",
    };

    let metrics: Array<{ label: string; value: number | string; color?: string }> | undefined;
    let table: any[] | null = null;
    let chart: any[] | null = null;
    let downloadUrl: string | null = null;

    if (!rawResult) return { reportingPeriod, metrics, table, chart, downloadUrl };

    if (rawResult.type === "summary" && rawResult.data) {
      const d = rawResult.data;
      metrics = [
        { label: "Present", value: d.present ?? 0, color: "emerald" },
        { label: "Absent", value: d.absent ?? 0, color: "rose" },
        { label: "Late Arrivals", value: d.late ?? 0, color: "amber" },
        { label: "On Leave", value: d.onLeave ?? 0, color: "blue" },
        { label: "Incomplete Checkouts", value: d.incompleteCheckout ?? 0, color: "purple" },
        { label: "Total Expected", value: d.totalExpected ?? 0, color: "slate" },
      ];
      chart = [
        { name: "Present", count: d.present ?? 0 },
        { name: "Absent", count: d.absent ?? 0 },
        { name: "Late", count: d.late ?? 0 },
        { name: "On Leave", count: d.onLeave ?? 0 },
      ];
    } else if (rawResult.type === "record_list" || rawResult.type === "employee_history") {
      table = rawResult.records || [];
      if (table && table.length > 0) {
        chart = table.slice(0, 10).map((r: any) => ({
          name: r.employeeName || r.date,
          hours: typeof r.totalMinutes === "number" ? Math.round((r.totalMinutes / 60) * 10) / 10 : 0,
        }));
      }
      metrics = [
        { label: "Total Records", value: rawResult.total ?? rawResult.totalRecords ?? (table?.length || 0), color: "indigo" },
      ];
    } else if (rawResult.type === "late_arrivals" || rawResult.type === "late_summary") {
      table = rawResult.records || rawResult.lateArrivals || [];
      metrics = [
        { label: "Late Arrivals", value: rawResult.totalLate ?? rawResult.count ?? (table?.length || 0), color: "amber" },
      ];
      if (table && table.length > 0) {
        chart = table.slice(0, 10).map((r: any) => ({
          name: r.employeeName || r.employeeCode || "Employee",
          hours: typeof r.totalMinutes === "number" ? Math.round((r.totalMinutes / 60) * 10) / 10 : 0,
        }));
      }
    } else if (rawResult.type === "incomplete_checkout") {
      table = rawResult.employees || [];
      metrics = [
        { label: "Incomplete Checkouts", value: rawResult.count ?? (table?.length || 0), color: "rose" },
      ];
    } else if (rawResult.type === "sales_performance") {
      const p = rawResult.topPerson;
      metrics = [
        { label: "Top Performer", value: p?.name || "Riya Soni", color: "emerald" },
        { label: "Role", value: p?.designation || "Head of Sales", color: "indigo" },
        { label: "Won Revenue", value: "₹" + (rawResult.totalWonRevenue || 0).toLocaleString("en-IN"), color: "emerald" },
        { label: "Active Pipeline", value: "₹" + (rawResult.totalActivePipeline || 0).toLocaleString("en-IN"), color: "amber" },
      ];
      table = (rawResult.performers || []).map((perf: any) => ({
        Salesperson: perf.name,
        Designation: perf.designation,
        "Won Deals": perf.wonLeads,
        "Won Revenue": "₹" + (perf.wonValue || 0).toLocaleString("en-IN"),
        "Active Pipeline": "₹" + (perf.pipelineValue || 0).toLocaleString("en-IN"),
        "Total Leads": perf.totalLeads,
      }));
    } else if (rawResult.type === "employee_profile" && rawResult.found && rawResult.user) {
      const u = rawResult.user;
      metrics = [
        { label: "Designation", value: u.designation || "Staff", color: "indigo" },
        { label: "Department", value: u.department || "General", color: "blue" },
        { label: "Today's Status", value: u.todayStatus === "PRESENT" ? "Present" : "Not Checked In", color: u.todayStatus === "PRESENT" ? "emerald" : "amber" },
      ];
      table = [
        {
          Name: u.name,
          Role: u.designation,
          Department: u.department,
          Code: u.employeeCode,
          Email: u.email,
          Today: u.todayStatus === "PRESENT" ? `In: ${u.punchIn}` : "Not Checked In",
        },
      ];
    } else if (rawResult.type === "department_employees") {
      table = rawResult.employees || [];
      metrics = [
        { label: "Headcount", value: rawResult.totalEmployees ?? 0, color: "indigo" },
        { label: "Department", value: rawResult.department || "All Departments", color: "blue" },
      ];
    } else if (rawResult.type === "department_summary") {
      if (rawResult.department && rawResult.employees && rawResult.employees.length > 0) {
        metrics = [
          { label: "Team Size", value: rawResult.todayTotalCount ?? rawResult.employees.length, color: "indigo" },
          { label: "Present Today", value: rawResult.todayPresentCount ?? 0, color: "emerald" },
          { label: "Department", value: rawResult.department, color: "blue" },
        ];
        table = rawResult.employees.map((e: any) => ({
          employeeName: e.name,
          department: e.department,
          employeeCode: e.code,
          date: "Today",
          punchIn: e.todayPunchIn || "--:--",
          punchOut: e.todayPunchOut || "--:--",
          status: e.todayStatus,
          workHours: e.todayStatus === "PRESENT" ? "Active" : "Not Checked In",
        }));
      } else {
        const depts = rawResult.departments || [];
        metrics = [
          { label: "Departments", value: depts.length, color: "indigo" },
          { label: "Month/Year", value: `${rawResult.month}/${rawResult.year}`, color: "slate" },
        ];
        chart = depts.map((d: any) => ({
          name: d.department,
          shifts: d.totalPresent,
          hours: d.totalHours,
        }));
        table = depts.map((d: any) => ({
          employeeName: d.department,
          department: `${d.employeeCount} staff`,
          date: `${rawResult.month}/${rawResult.year}`,
          punchIn: `${d.totalPresent} shifts`,
          punchOut: `${d.totalLate} late`,
          status: "PRESENT",
          workHours: `${d.totalHours} hrs`,
        }));
      }
    } else if (rawResult.type === "monthly_summary" || rawResult.type === "monthly") {
      const rep = rawResult.data || rawResult;
      const overall = rep.overallSummary || rep;
      metrics = [
        { label: "Total Logged Shifts", value: overall.totalRecords ?? 0, color: "indigo" },
        { label: "Total Hours", value: `${overall.totalHoursWorked ?? 0} hrs`, color: "blue" },
        { label: "Late Arrivals", value: overall.totalLateArrivals ?? 0, color: "amber" },
        { label: "Official Holidays", value: rep.holidaysCount ?? 0, color: "slate" },
      ];
      chart = (rep.departmentBreakdown || []).map((d: any) => ({
        name: d.department,
        shifts: d.totalPresent,
        hours: d.totalHours,
      }));
      table = (rep.employeeSummaries || []).map((e: any) => ({
        employeeName: e.name,
        department: e.department,
        employeeCode: e.code,
        date: `${rep.month || ""}/${rep.year || ""}`,
        punchIn: `${e.presentDays} days`,
        punchOut: `${e.lateDays} late`,
        status: "PRESENT",
        workHours: e.totalHours,
      }));
    } else if (rawResult.type === "pdf_report") {
      downloadUrl = rawResult.downloadUrl;
      metrics = [
        { label: "Period", value: `${rawResult.startDate} to ${rawResult.endDate}`, color: "indigo" },
        { label: "Scope", value: rawResult.department || "Company Wide", color: "blue" },
      ];
    }

    return { reportingPeriod, metrics, table, chart, downloadUrl };
  }

  /**
   * Process a conversational natural-language question
   */
  static async processQuestion(
    question: string,
    caller: CurrentUserSession
  ): Promise<AnalyticsQueryResponse> {
    if (!question || question.trim().length === 0) {
      return {
        success: false,
        question,
        toolUsed: "none",
        parameters: {},
        data: null,
        explanation: "Please enter a valid attendance question.",
        source: "fallback",
        error: "Empty query",
      };
    }

    // Step 1: Classify user intent
    const classification = await OllamaClient.classifyIntent(question);
    const toolName = classification.toolName;

            if (!toolName || !ATTENDANCE_TOOLS[toolName]) {
      const generalAnswer = await OllamaClient.generalChat(question);
      if (generalAnswer) {
        return {
          success: true,
          question,
          toolUsed: "general_chat",
          parameters: {},
          data: null,
          explanation: generalAnswer,
          source: "ollama",
        };
      }

      return {
        success: true,
        question,
        toolUsed: "assistant_guide",
        parameters: {},
        data: null,
        explanation: "I am your ESS OS Intelligence Assistant. I specialize in querying real-time company records, employee attendance, and sales performance directly from your database.\n\nHere are some questions you can ask me:\n• 💼 **Sales & Leads:** \"Who is the best person in sales?\", \"Show sales performance\"\n• 📊 **Attendance & Time:** \"How many employees are present today?\", \"Who arrived late today?\", \"Which employees have incomplete check-outs?\"\n• 🏢 **Departments:** \"Show attendance for Engineering department\"\n• 📑 **Reports:** \"Generate monthly attendance summary PDF\"",
        source: classification.source,
      };
    }

    const tool = ATTENDANCE_TOOLS[toolName];

    // Step 2: Enforce RBAC permissions
    if (tool.requiresAdmin && !hasAdminAttendanceAccess(caller)) {
      // If a non-admin employee asks for company-wide stats or other employee stats,
      // redirect safely to their own personal attendance if profile exists
      if (caller.employeeId) {
        try {
          const empTool = ATTENDANCE_TOOLS.get_employee_attendance;
          const data = await empTool.execute({ employeeId: caller.employeeId }, caller);
          const structured = this.formatStructuredData("get_employee_attendance", data);
          return {
            success: true,
            question,
            toolUsed: "get_employee_attendance",
            parameters: { employeeId: caller.employeeId },
            data,
            explanation: "🔒 Company-wide attendance reports require Administrator or Owner privileges. Here is your personal attendance record instead.",
            source: classification.source,
            ...structured,
          };
        } catch {
          // If employee profile query fails, fall through to Forbidden response
        }
      }

      return {
        success: false,
        question,
        toolUsed: toolName,
        parameters: classification.arguments,
        data: null,
        explanation: "You do not have administrative permission to view team-wide attendance records.",
        source: classification.source,
        error: "Forbidden",
      };
    }

    // Step 3: Validate tool arguments using Zod
    const validationResult = tool.parameters.safeParse(classification.arguments);
    const validArgs = validationResult.success ? validationResult.data : {};

    // Step 4: Execute tool via AttendanceService
    let rawResult: any;
    try {
      rawResult = await tool.execute(validArgs, caller);
    } catch (err: any) {
      return {
        success: false,
        question,
        toolUsed: toolName,
        parameters: validArgs,
        data: null,
        explanation: `Unable to complete query: ${err.message}`,
        source: classification.source,
        error: err.message,
      };
    }

    // Step 5: Synthesize explanation from verified data
    const explanation = await OllamaClient.explainResult(question, toolName, rawResult);
    const structured = this.formatStructuredData(toolName, rawResult);

    return {
      success: true,
      question,
      toolUsed: toolName,
      parameters: validArgs,
      data: rawResult,
      explanation,
      source: classification.source,
      ...structured,
    };
  }
}
