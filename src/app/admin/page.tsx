import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getCurrentSession();

  // Route protection: Only users with role "admin" can access the spider console
  if (session.role !== "admin") {
    redirect("/admin/login");
  }

  return <AdminDashboardClient />;
}
