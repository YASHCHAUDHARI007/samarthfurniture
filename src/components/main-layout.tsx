
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
import { Company } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "./ui/separator";

const FKeyShortcut = ({ children }: { children: React.ReactNode }) => (
  <span className="ml-auto text-xs tracking-widest text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
    {children}
  </span>
);

function Menu({ userRole }: { userRole: string | null }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (path: string) => pathname === path || (path !== "/" && pathname.startsWith(path));

  const isOwner = userRole === "owner";
  const isAdmin = userRole === "administrator";
  const isCoordinator = userRole === "coordinator";
  const isFactory = userRole === "factory";

  const canSeeStandardOrders = isOwner || isCoordinator || isAdmin;
  const canSeeFactoryFeatures = isFactory || isOwner || isAdmin || isCoordinator;
  const isAccounting = isOwner || isAdmin;
  const canManageUsers = isOwner || isAdmin;
  const canSeeReports = isOwner || isAdmin;
  const canManageInventory = isOwner || isFactory || isAdmin;

  return (
    <SidebarMenu>
      {canSeeStandardOrders && (
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
              onClick={handleLinkClick}
            >
              <Link href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
                <FKeyShortcut>F1</FKeyShortcut>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/customer-orders")}
              tooltip={{
                children: "Customized Orders",
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href="/customer-orders">
                <User />
                <span>Customized Orders</span>
                <FKeyShortcut>F2</FKeyShortcut>
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
              onClick={handleLinkClick}
            >
              <Link href="/dealer-orders">
                <Building />
                <span>Dealer Orders</span>
                <FKeyShortcut>F3</FKeyShortcut>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </>
      )}

      {canSeeFactoryFeatures && (
         <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/direct-sale")}
              tooltip={{
                children: "Direct Sale",
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href="/direct-sale">
                <ShoppingBag />
                <span>Direct Sale</span>
                <FKeyShortcut>F4</FKeyShortcut>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
      )}

      {canSeeFactoryFeatures && (
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActive("/factory-dashboard")}
            tooltip={{
              children: "Factory Dashboard",
              side: "right",
              align: "center",
            }}
            onClick={handleLinkClick}
          >
            <Link href="/factory-dashboard">
              <Factory />
              <span>Factory Dashboard</span>
              <FKeyShortcut>F5</FKeyShortcut>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      
      {isAccounting && (
        <>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/billing")}
              tooltip={{
                children: "Sales",
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href="/billing">
                <Receipt />
                <span>Sales</span>
                <FKeyShortcut>F6</FKeyShortcut>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/purchases")}
              tooltip={{
                children: "Purchases",
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href="/purchases">
                <ShoppingCart />
                <span>Purchases</span>
                <FKeyShortcut>F7</FKeyShortcut>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/payments")}
              tooltip={{
                children: "Vouchers",
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href="/payments">
                <Banknote />
                <span>Vouchers</span>
                <FKeyShortcut>F8</FKeyShortcut>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/ledger")}
              tooltip={{
                children: "Ledger",
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href="/ledger">
                <BookText />
                <span>Ledger</span>
                <FKeyShortcut>F9</FKeyShortcut>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </>
      )}


      {canSeeFactoryFeatures && !isAccounting && (
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/billing")}
              tooltip={{
                children: "Billing",
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href="/billing">
                <Receipt />
                <span>Billing</span>
                <FKeyShortcut>F6</FKeyShortcut>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
      )}
      
      {canSeeFactoryFeatures && (
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/transport")}
              tooltip={{
                children: "Transport",
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href="/transport">
                <Truck />
                <span>Transport</span>
                <FKeyShortcut>F11</FKeyShortcut>
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
          onClick={handleLinkClick}
        >
          <Link href="/stock-turnover">
            <Warehouse />
            <span>Stock Levels</span>
            <FKeyShortcut>F10</FKeyShortcut>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {canManageInventory && (
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActive("/raw-materials")}
            tooltip={{
              children: "Raw Materials",
              side: "right",
              align: "center",
            }}
            onClick={handleLinkClick}
          >
            <Link href="/raw-materials">
              <Wrench />
              <span>Raw Materials</span>
              <FKeyShortcut>F12</FKeyShortcut>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {canSeeReports && (
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
              onClick={handleLinkClick}
            >
              <Link href="/daily-report">
                <ClipboardList />
                <span>Daily Report</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </>
      )}
      {isAdmin && (
        <>
          <Separator className="my-2" />
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/manage-companies")}
              tooltip={{
                children: "Manage Companies",
                side: "right",
                align: "center",
              }}
              onClick={handleLinkClick}
            >
              <Link href="/manage-companies">
                <Building2 />
                <span>Companies</span>
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
              onClick={handleLinkClick}
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
            router.refresh();
            if (isMobile) {
                setOpenMobile(false);
            }
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
            <Separator />
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
    const fKeyRoutes: { [key: string]: string } = {
        'F1': '/', 'F2': '/customer-orders', 'F3': '/dealer-orders', 'F4': '/direct-sale', 'F5': '/factory-dashboard', 'F6': '/billing', 'F7': '/purchases', 'F8': '/payments', 'F9': '/ledger', 'F10': '/stock-turnover', 'F11': '/transport', 'F12': '/raw-materials',
    };

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
