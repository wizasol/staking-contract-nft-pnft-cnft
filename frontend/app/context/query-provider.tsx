"use client";

import { QueryClient, QueryClientProvider } from "react-query";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
