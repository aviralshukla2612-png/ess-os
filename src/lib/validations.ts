import { z } from "zod";

export const leadSchema = z.object({
  contactPerson: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "Lead Contact"), z.string().default("Lead Contact")),
  clientName: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "New Prospect"), z.string().default("New Prospect")),
  phone: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "+91 00000 00000"), z.string().default("+91 00000 00000")),
  email: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "contact@prospect.com"), z.string().default("contact@prospect.com")),
  projectScope: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "General inquiry"), z.string().default("General inquiry")),
  leadValue: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : Math.max(0, num);
  }, z.number().nonnegative().default(0)),
  expectedRevenue: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : Math.max(0, num);
  }, z.number().nonnegative().default(0)),
  leadPriority: z.enum(["HOT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  stage: z.enum(["NEW", "CONTACTED", "REQUIREMENTS", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).default("NEW"),
  gstNo: z.string().optional(),
  remarks: z.string().optional(),
});

export const clientSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  industry: z.string().optional(),
  totalBilling: z.number().nonnegative().default(0),
});
