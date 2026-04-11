import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionDetailView } from "@/components/sessions/session-detail-view";

type PageProps = { params: Promise<{ id: string }> };

export default async function SessionDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; role?: string };
  const { id } = await params;

  return (
    <div className="px-2 py-4">
      <SessionDetailView
        sessionId={id}
        isCoach={(user.role ?? "") === "COACH"}
        currentUserId={user.id ?? ""}
      />
    </div>
  );
}
