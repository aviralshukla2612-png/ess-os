import { z } from "zod";

export const leadSchema = z.object({
  contactPerson: z.string().min(2, "Contact person is required"),
  clientName: z.string().min(2, "Company name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  projectScope: z.string().min(5, "Project scope is required"),
  leadValue: z.number().positive("Lead value must be positive"),
  expectedRevenue: z.number().positive("Expected revenue must be positive"),
  leadPriority: z.enum(["HOT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  stage: z.enum(["NEW", "CONTACTED", "REQUIREMENTS", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).default("NEW"),
  gstNo: z.string().optional(),
});

export const clientSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  industry: z.string().optional(),
  totalBilling: z.number().nonnegative().default(0),
});
