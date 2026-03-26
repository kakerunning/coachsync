import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionsListView } from "@/components/sessions/sessions-list-view";

export default async function SessionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="px-2 py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        <Link
          href="/dashboard/sessions/new"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "#1D9E75" }}
        >
          + Log session
        </Link>
      </div>
      <SessionsListView />
    </div>
  );
}
