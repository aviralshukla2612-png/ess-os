import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

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
  }

  // Fallback
  redirect("/login");
}
