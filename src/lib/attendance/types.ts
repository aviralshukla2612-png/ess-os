import { z } from "zod";

/**
 * Attendance Query Validation Schema
 */
export const AttendanceQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid startDate format (expected YYYY-MM-DD)").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid endDate format (expected YYYY-MM-DD)").optional(),
  employeeId: z.string().optional(),
  departmentId: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "ON_LEAVE", "LATE", "HALF_DAY", "PENDING"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["date", "punchIn", "punchOut", "totalMinutes"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "startDate must be before or equal to endDate",
  path: ["startDate"],
});

export type AttendanceQuery = z.infer<typeof AttendanceQuerySchema>;

/**
 * Monthly Report Query Schema
 */
export const MonthlyQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  employeeId: z.string().optional(),
  departmentId: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "ON_LEAVE", "LATE", "HALF_DAY", "ALL"]).default("ALL"),
});

export type MonthlyQuery = z.infer<typeof MonthlyQuerySchema>;

/**
 * Check-in Request Schema
 */
export const CheckInSchema = z.object({
  notes: z.string().max(500).optional(),
  clientTimestamp: z.string().optional(),
  dateOffsetDays: z.number().int().min(0).max(30).optional(),
});

export type CheckInInput = z.infer<typeof CheckInSchema>;

/**
 * Check-out Request Schema
 */
export const CheckOutSchema = z.object({
  reason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
  clientTimestamp: z.string().optional(),
});

export type CheckOutInput = z.infer<typeof CheckOutSchema>;

/**
 * Pagination Metadata Contract
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standard ApiResponse Contract
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: PaginationMeta;
  error?: string;
  details?: any;
}
