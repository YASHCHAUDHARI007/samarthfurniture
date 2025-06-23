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
  LayoutDashboard,
  LogOut,
  User,
  Users,
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
  const [userAvatar, setUserAvatar] = useState('U');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem("loggedInUser");
      setLoggedInUser(userEmail);
      if (userEmail) {
        setUserAvatar(userEmail.substring(0,2).toUpperCase());
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("loggedInUser");
    }
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;
  
  const isOwner = loggedInUser === "owner@furnishflow.com";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Button variant="ghost" size="icon" className="shrink-0 bg-sidebar-primary/20 text-sidebar-primary hover:bg-sidebar-primary/30">
              <Armchair className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-sidebar-foreground">FurnishFlow</h1>
                <p className="text-xs text-sidebar-foreground/70">Furniture Management</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/")}
                tooltip={{ children: "Dashboard", side: "right", align:"center"}}
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
                tooltip={{ children: "Customer Orders", side: "right", align:"center"}}
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
                tooltip={{ children: "Dealer Orders", side: "right", align:"center"}}
              >
                <Link href="/dealer-orders">
                  <Building />
                  <span>Dealer Orders</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isOwner && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/manage-users")}
                  tooltip={{ children: "Manage Users", side: "right", align:"center"}}
                >
                  <Link href="/manage-users">
                    <Users />
                    <span>Manage Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center justify-between gap-3 p-2 rounded-md transition-colors m-2 bg-sidebar-accent/20">
            <div className="flex items-center gap-3 truncate">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="person" />
                <AvatarFallback>{userAvatar}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-sidebar-foreground truncate capitalize">{loggedInUser ? (loggedInUser.split('@')[0]) : 'User'}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">
                  {loggedInUser || 'Not logged in'}
                </span>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={handleLogout}>
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
