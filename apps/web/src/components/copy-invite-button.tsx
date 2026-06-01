'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" size="sm" onClick={copy} className="h-auto py-0 px-1 text-brand">
      {copied ? 'Copied!' : `Invite: ${code}`}
    </Button>
  );
}
