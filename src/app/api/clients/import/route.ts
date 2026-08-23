import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const importedArray = body.imported || [];

    if (importedArray.length === 0) {
      return NextResponse.json({ success: false, error: "No data to import" }, { status: 400 });
    }

    const currentCount = await prisma.client.count();

    const createdClients = await prisma.$transaction(
      importedArray.map((item: any, idx: number) => {
        return prisma.client.create({
          data: {
            clientNumber: `CLT-00${currentCount + idx + 1}`,
            companyName: item.companyName,
            email: item.email || "import@example.com",
            phone: item.phone || "0000000000",
            totalBusiness: 250000,
            outstandingBalance: 250000,
            createdById: authRes.id,
            contacts: {
              create: [
                {
                  name: item.contactPerson || "Primary Contact",
                  designation: "Primary Contact",
                  email: item.email || "import@example.com",
                  phone: item.phone || "0000000000",
                  isPrimary: true,
                },
              ],
            },
          },
        });
      })
    );

    return NextResponse.json({ success: true, count: createdClients.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to import clients" }, { status: 500 });
  }
}
