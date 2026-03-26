import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProgramListView } from "@/components/programs/program-list-view";

export default async function ProgramsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role ?? "ATHLETE";

  return <ProgramListView role={role} />;
}
