import { NewSessionForm } from "@/components/sessions/new-session-form";

export default function NewSessionPage() {
  return (
    <div className="px-2 py-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Log session</h1>
      <NewSessionForm />
    </div>
  );
}
