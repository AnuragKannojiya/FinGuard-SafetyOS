'use client';

import { AICopilot } from '@/components/ui/ai-copilot';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AICopilot />
    </>
  );
}
