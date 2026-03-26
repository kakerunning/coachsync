import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AthleteListView } from "@/components/athletes/athlete-list-view";

export default async function AthletesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role ?? "ATHLETE";

  if (role !== "COACH") {
    redirect("/dashboard");
  }

  return <AthleteListView />;
}
