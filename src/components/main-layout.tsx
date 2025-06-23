
"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Armchair,
  Building,
  ClipboardList,
  Factory,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  Warehouse,
  Wrench,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState("U");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userEmail = localStorage.getItem("loggedInUser");
      const role = localStorage.getItem("userRole");
      setLoggedInUser(userEmail);
      setUserRole(role);
      if (userEmail) {
        setUserAvatar(userEmail.substring(0, 2).toUpperCase());
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("userRole");
    }
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 bg-sidebar-primary/20 text-sidebar-primary hover:bg-sidebar-primary/30"
            >
              <Armchair className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                FurnishFlow
              </h1>
              <p className="text-xs text-sidebar-foreground/70">
                Furniture Management
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {(userRole === "owner" || userRole === "coordinator") && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/")}
                    tooltip={{
                      children: "Dashboard",
                      side: "right",
                      align: "center",
                    }}
                  >
                    <Link href="/">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/customer-orders")}
                    tooltip={{
                      children: "Customer Orders",
                      side: "right",
                      align: "center",
                    }}
                  >
                    <Link href="/customer-orders">
                      <User />
                      <span>Customer Orders</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/dealer-orders")}
                    tooltip={{
                      children: "Dealer Orders",
                      side: "right",
                      align: "center",
                    }}
                  >
                    <Link href="/dealer-orders">
                      <Building />
                      <span>Dealer Orders</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            {userRole === "factory" && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/factory-dashboard")}
                  tooltip={{
                    children: "Factory Dashboard",
                    side: "right",
                    align: "center",
                  }}
                >
                  <Link href="/factory-dashboard">
                    <Factory />
                    <span>Factory Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            
            {(userRole === "owner" || userRole === "factory") && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/raw-materials")}
                  tooltip={{
                    children: "Raw Materials",
                    side: "right",
                    align: "center",
                  }}
                >
                  <Link href="/raw-materials">
                    <Wrench />
                    <span>Raw Materials</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {(userRole === "owner" || userRole === "factory") && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/transport")}
                  tooltip={{
                    children: "Transport",
                    side: "right",
                    align: "center",
                  }}
                >
                  <Link href="/transport">
                    <Truck />
                    <span>Transport</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/stock-turnover")}
                tooltip={{
                  children: "Stock Levels",
                  side: "right",
                  align: "center",
                }}
              >
                <Link href="/stock-turnover">
                  <Warehouse />
                  <span>Stock Levels</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {userRole === "owner" && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/daily-report")}
                    tooltip={{
                      children: "Daily Report",
                      side: "right",
                      align: "center",
                    }}
                  >
                    <Link href="/daily-report">
                      <ClipboardList />
                      <span>Daily Report</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/manage-users")}
                    tooltip={{
                      children: "Manage Users",
                      side: "right",
                      align: "center",
                    }}
                  >
                    <Link href="/manage-users">
                      <Users />
                      <span>Manage Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="m-2 flex items-center justify-between gap-3 rounded-md bg-sidebar-accent/20 p-2 transition-colors">
            <div className="flex items-center gap-3 truncate">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src="https://placehold.co/100x100.png"
                  alt="User Avatar"
                  data-ai-hint="person"
                />
                <AvatarFallback>{userAvatar}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="truncate text-sm font-medium capitalize text-sidebar-foreground">
                  {loggedInUser ? loggedInUser.split("@")[0] : "User"}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {loggedInUser || "Not logged in"}
                </span>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
