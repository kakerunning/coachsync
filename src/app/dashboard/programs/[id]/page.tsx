import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProgramDetailView } from "@/components/programs/program-detail-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProgramDetailPage({ params }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const role = (session.user as { role?: string }).role ?? "ATHLETE";

  return <ProgramDetailView id={id} role={role} />;
}
