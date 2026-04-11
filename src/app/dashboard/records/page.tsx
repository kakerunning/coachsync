import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RecordListView } from "@/components/records/record-list-view";

export default async function RecordsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; role?: string };
  const role = user.role ?? "ATHLETE";
  const userId = user.id ?? "";

  return <RecordListView isCoach={role === "COACH"} currentUserId={userId} />;
}
