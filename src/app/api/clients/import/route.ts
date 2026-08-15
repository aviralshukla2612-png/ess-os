import { NextResponse } from "next/server";
import { apiDb } from "@/lib/apiDb";
import { ClientEntity } from "@/lib/prototypeStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const importedArray = body.imported || [];

    const newClients: ClientEntity[] = importedArray.map((item: any, idx: number) => ({
      id: `CLT-00${apiDb.clients.length + idx + 1}`,
      clientCode: item.companyName.slice(0, 4).toUpperCase(),
      companyName: item.companyName,
      contactPerson: item.contactPerson,
      email: item.email,
      phone: item.phone,
      industry: "Imported Account",
      totalBilling: 250000,
      paidBilling: 0,
      pendingBilling: 250000,
      status: "ACTIVE",
      portalToken: `token-imported-${idx}-${Date.now()}`,
      activeProjects: [],
      completedProjects: [],
      invoices: [],
      notes: [],
    }));

    apiDb.clients = [...newClients, ...apiDb.clients];
    return NextResponse.json({ success: true, count: newClients.length, data: newClients });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to parse body" }, { status: 400 });
  }
}
