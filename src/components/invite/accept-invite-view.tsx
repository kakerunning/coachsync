"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type InviteInfo = {
  token: string;
  coach: { id: string; name: string };
  expiresAt: string;
  isUsed: boolean;
};

type Props = { token: string; userRole: string };

export function AcceptInviteView({ token, userRole }: Props) {
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((json: { data: InviteInfo | null; error: string | null }) => {
        if (json.error || !json.data) {
          setLoadError(json.error ?? "Invalid invite link");
        } else {
          setInfo(json.data);
        }
      })
      .catch(() => setLoadError("Failed to load invite details"));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, { method: "POST" });
      const json = (await res.json()) as { error: string | null };
      if (!res.ok || json.error) {
        setAcceptError(json.error ?? "Failed to accept invite");
      } else {
        setAccepted(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch {
      setAcceptError("Network error — please try again");
    } finally {
      setAccepting(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full rounded-2xl border bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-xl font-semibold text-gray-900">Invalid Invite</h1>
          <p className="mt-2 text-sm text-gray-500">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full rounded-2xl border bg-white p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h1 className="text-xl font-semibold text-gray-900">You&apos;re linked!</h1>
          <p className="mt-2 text-sm text-gray-500">
            You are now connected with {info.coach.name}. Redirecting to dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Coach Invite</h1>
        <p className="mt-2 text-sm text-gray-500">
          <span className="font-medium text-gray-800">{info.coach.name}</span> has invited you to
          join their CoachSync roster.
        </p>

        {userRole !== "ATHLETE" && (
          <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
            Only athletes can accept coach invites. You are signed in as a coach.
          </div>
        )}

        {acceptError && (
          <p className="mt-4 text-sm text-red-600">{acceptError}</p>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleAccept}
            disabled={accepting || userRole !== "ATHLETE"}
            className="flex-1"
          >
            {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Accept Invite
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
