import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { SUB_ADMIN_MODULES } from "@/lib/subAdminModules";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "OWNER") {
    redirect("/owner");
  } else if (role === "SALES") {
    redirect("/sales");
  } else if (role === "EMPLOYEE") {
    redirect("/attendance");
  } else if (role === "SUB_ADMIN") {
    const permissions: string[] = session.user.permissions || [];
    // Redirect to the first module the sub-admin has permission for
    const firstAllowed = SUB_ADMIN_MODULES.find((m) => permissions.includes(m.id));
    if (firstAllowed) {
      redirect(firstAllowed.href);
    } else {
      redirect("/attendance");
    }
  }

  // Fallback
  redirect("/login");
}

