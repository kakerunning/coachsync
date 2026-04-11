import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EventListView } from "@/components/events/event-list-view";

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; role?: string };
  const role = user.role ?? "ATHLETE";
  const userId = user.id ?? "";

  return <EventListView role={role} userId={userId} />;
}
