import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const clientSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  industry: z.string().optional(),
  totalBilling: z.number().nonnegative().default(0),
});

const prisma = new PrismaClient();

async function main() {
  const body = {
    companyName: "Acme Corp",
    contactPerson: "Jane Doe",
    email: "client@company.com",
    phone: "+91 98000 00000",
    totalBilling: 500000,
  };

  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    console.log("Validation failed", parsed.error.format());
    return;
  }
  
  const validData = parsed.data;
  console.log("Valid data:", validData);

  const clientCount = await prisma.client.count();

  try {
    const newClient = await prisma.client.create({
      data: {
        clientNumber: `CLT-00${clientCount + 1}`,
        companyName: validData.companyName,
        email: validData.email,
        phone: validData.phone,
        totalBusiness: validData.totalBilling,
        outstandingBalance: validData.totalBilling,
        createdById: "109896ce-3692-42f9-9232-7be9d6c626ae", // Owner id
        contacts: {
          create: [
            {
              name: validData.contactPerson,
              designation: "Primary Contact",
              email: validData.email,
              phone: validData.phone,
              isPrimary: true,
            },
          ],
        },
      },
      include: {
        contacts: true,
      },
    });
    console.log("Created client:", newClient.id);
  } catch (err) {
    console.error("Prisma error:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
