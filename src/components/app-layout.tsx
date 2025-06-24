
"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/main-layout";
import { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const noLayoutRoutes = ["/login"];

  if (noLayoutRoutes.includes(pathname) || pathname.startsWith("/ledger/")) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
