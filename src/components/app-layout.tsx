
"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/main-layout";
import { TallyLayout } from "@/components/tally-layout";
import { ReactNode, useEffect, useState } from "react";
import type { UserRole } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This code runs only on the client
    const role = localStorage.getItem("userRole") as UserRole | null;
    setUserRole(role);
    setIsLoading(false);
  }, [pathname]);

  const noLayoutRoutes = ["/login"];
  if (noLayoutRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="space-y-4">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-64 w-64" />
                <Skeleton className="h-12 w-64" />
            </div>
        </div>
    );
  }

  if (userRole === "administrator") {
    return <TallyLayout>{children}</TallyLayout>;
  }

  return <MainLayout>{children}</MainLayout>;
}
