import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import DeskClient from "./DeskClient";

export const dynamic = "force-dynamic";

export default async function DeskPage() {
  const session = await getCurrentSession();

  if (session.role !== "admin") {
    redirect("/admin/login?redirect=/desk");
  }

  return <DeskClient />;
}
