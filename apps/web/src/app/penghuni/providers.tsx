"use client";

import { SWRConfig } from "swr";
import { FeedbackProvider } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

export function TenantProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher: (path: string) => api(path), revalidateOnFocus: true }}>
      <FeedbackProvider>{children}</FeedbackProvider>
    </SWRConfig>
  );
}
