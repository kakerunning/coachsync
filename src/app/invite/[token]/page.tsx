import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AcceptInviteView } from "@/components/invite/accept-invite-view";

type PageProps = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const session = await auth();

  // Not logged in — send to login, then back here after
  if (!session?.user) {
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  const user = session.user as { id?: string; role?: string; name?: string };

  return <AcceptInviteView token={token} userRole={user.role ?? ""} />;
}
