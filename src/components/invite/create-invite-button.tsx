"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createInvite } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check } from "lucide-react";

export function CreateInviteButton() {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: createInvite,
    onSuccess: (data) => {
      const url = `${window.location.origin}/invite/${data.token}`;
      setInviteUrl(url);
      setOpen(true);
    },
  });

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleClose() {
    setOpen(false);
    setInviteUrl(null);
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        <Link2 className="mr-2 h-4 w-4" />
        {mutation.isPending ? "Generating…" : "Generate Invite Link"}
      </Button>

      {mutation.isError && (
        <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Link</DialogTitle>
            <DialogDescription>
              Share this link with an athlete. It expires in 24 hours and can only be used once.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Input readOnly value={inviteUrl ?? ""} className="font-mono text-xs" />
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
