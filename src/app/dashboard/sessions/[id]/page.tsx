import { SessionDetailView } from "@/components/sessions/session-detail-view";

type PageProps = { params: Promise<{ id: string }> };

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="px-2 py-4">
      <SessionDetailView sessionId={id} />
    </div>
  );
}
