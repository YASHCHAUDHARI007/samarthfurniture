
"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  useSidebar,
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
  Receipt,
  ShoppingCart,
  BookText,
  Banknote,
  ShoppingBag,
  Building2,
  BookUser,
  FileSpreadsheet,
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
import type { Company, UserRole } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FKeyShortcut = ({ children }: { children: React.ReactNode }) => (
  <span className="ml-auto text-xs tracking-widest text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
    {children}
  </span>
);

const navItems: {
  path: string;
  icon: React.ElementType;
  text: string;
  fkey?: string;
  roles: UserRole[];
  separator?: boolean;
}[] = [
  { path: "/", icon: LayoutDashboard, text: "Dashboard", fkey: "F1", roles: ["owner", "coordinator", "administrator"] },
  { path: "/customer-orders", icon: User, text: "Customized Orders", fkey: "F2", roles: ["owner", "coordinator", "administrator"] },
  { path: "/dealer-orders", icon: Building, text: "Dealer Orders", fkey: "F3", roles: ["owner", "coordinator", "administrator"] },
  { path: "/direct-sale", icon: ShoppingBag, text: "Direct Sale", fkey: "F4", roles: ["owner", "coordinator", "factory", "administrator"] },
  { path: "/factory-dashboard", icon: Factory, text: "Factory Dashboard", fkey: "F5", roles: ["owner", "coordinator", "factory", "administrator"] },
  { path: "/billing", icon: Receipt, text: "Sales & Billing", fkey: "F6", roles: ["owner", "coordinator", "factory", "administrator"] },
  { path: "/purchases", icon: ShoppingCart, text: "Purchases", fkey: "F7", roles: ["owner", "administrator"] },
  { path: "/payments", icon: Banknote, text: "Vouchers", fkey: "F8", roles: ["owner", "administrator"] },
  { path: "/ledger", icon: BookText, text: "Ledger", fkey: "F9", roles: ["owner", "administrator"] },
  { path: "/transport", icon: Truck, text: "Transport", fkey: "F11", roles: ["owner", "coordinator", "factory", "administrator"] },
  { path: "/stock-turnover", icon: Warehouse, text: "Finished Stock", fkey: "F10", roles: ["owner", "coordinator", "factory", "administrator"] },
  { path: "/raw-materials", icon: Wrench, text: "Raw Materials", fkey: "F12", roles: ["owner", "factory", "administrator"] },
  { path: "/daily-report", icon: ClipboardList, text: "Daily Report", roles: ["owner", "administrator"] },
  { path: "/gst-reports", icon: FileSpreadsheet, text: "GST Reports", roles: ["owner", "administrator"] },
  { path: "/manage-companies", icon: Building2, text: "Companies", roles: ["owner", "administrator"], separator: true },
  { path: "/locations", icon: Warehouse, text: "Locations", roles: ["owner", "administrator"] },
  { path: "/manage-users", icon: Users, text: "Manage Users", roles: ["owner", "administrator"] },
  { path: "/contacts", icon: BookUser, text: "Contacts", roles: ["owner", "administrator"] },
];

function Menu({ userRole }: { userRole: string | null }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (path: string) => pathname === path || (path !== "/" && pathname.startsWith(path));

  const filteredNavItems = useMemo(() => {
    if (!userRole) return [];
    return navItems.filter(item => item.roles.includes(userRole as UserRole));
  }, [userRole]);

  return (
    <SidebarMenu>
      {filteredNavItems.map((item, index) => (
        <React.Fragment key={item.path}>
          {item.separator && (
            <SidebarMenuItem>
              <div className="my-2 mx-2 h-px w-auto bg-sidebar-border" />
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive(item.path)}
              tooltip={{
                children: item.text,
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href={item.path}>
                <item.icon />
                <span>{item.text}</span>
                {item.fkey && <FKeyShortcut>{item.fkey}</FKeyShortcut>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </React.Fragment>
      ))}
    </SidebarMenu>
  );
}

function CompanySwitcher() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
    const { isMobile, setOpenMobile } = useSidebar();
    const router = useRouter();

    useEffect(() => {
        const storedCompanies = JSON.parse(localStorage.getItem('samarth_furniture_companies') || '[]');
        setCompanies(storedCompanies);
        const storedActiveId = localStorage.getItem('activeCompanyId');
        setActiveCompanyId(storedActiveId);
    }, []);

    const handleCompanyChange = (companyId: string) => {
        if (companyId) {
            localStorage.setItem('activeCompanyId', companyId);
            setActiveCompanyId(companyId);
            window.location.reload();
        }
    };

    if (companies.length === 0) return null;

    return (
        <div className="p-2 space-y-2">
            <label className="text-xs font-semibold text-sidebar-foreground/70 px-2">
                Active Company
            </label>
            <Select onValueChange={handleCompanyChange} value={activeCompanyId || ""}>
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent>
                    {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                            {company.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="my-2 mx-2 h-px w-auto bg-sidebar-border" />
        </div>
    )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState("U");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fKeyRoutes: { [key: string]: string } = navItems.reduce((acc, item) => {
        if (item.fkey) {
            acc[item.fkey] = item.path;
        }
        return acc;
    }, {} as { [key: string]: string });

    const handleKeyDown = (event: KeyboardEvent) => {
        const route = fKeyRoutes[event.key];
        if (route) {
            event.preventDefault();
            router.push(route);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("loggedInUser");
      const role = localStorage.getItem("userRole");
      setLoggedInUser(username);
      setUserRole(role);
      if (username) {
        setUserAvatar(username.substring(0, 2).toUpperCase());
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("userRole");
      localStorage.removeItem("activeCompanyId");
    }
    router.push("/login");
  };

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
                Samarth Furniture
              </h1>
              <p className="text-xs text-sidebar-foreground/70">
                Furniture Management
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <CompanySwitcher />
          <Menu userRole={userRole} />
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
                  {loggedInUser || "User"}
                </span>
                <span className="truncate text-xs capitalize text-sidebar-foreground/70">
                  {userRole || "No role"}
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
