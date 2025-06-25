
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subMonths } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Package, Users, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";


const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const username = localStorage.getItem("loggedInUser");
    if (!username) {
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
    
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);

    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (!activeCompanyId) {
      setOrders([]);
      setChartData([]);
      return;
    }

    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("loggedInUser");
    const ordersKey = `samarth_furniture_${activeCompanyId}_orders`;

    let allOrders: Order[] = JSON.parse(localStorage.getItem(ordersKey) || "[]");

    let userOrders = allOrders;
    if (role === "coordinator" && username) {
      userOrders = allOrders.filter(order => order.createdBy === username);
    }
    setOrders(userOrders);

    // Generate dynamic chart data from all orders, not just user's
    const now = new Date();
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      last6Months.push(format(d, "MMMM"));
    }

    const salesByMonth = last6Months.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {} as Record<string, number>);

    const deliveredOrdersWithDate = allOrders.filter(
      (o) => o.status === "Delivered" && o.deliveredAt
    );

    deliveredOrdersWithDate.forEach((order) => {
      const month = format(new Date(order.deliveredAt!), "MMMM");
      if (salesByMonth.hasOwnProperty(month)) {
        let units = 0;
        if (order.type === "Customized") {
          units = 1;
        } else if (order.details) {
          const quantities = order.details
            .split("\n")
            .map((line) => {
              const match = line.match(/^(\d+)x/);
              return match ? parseInt(match[1], 10) : 0;
            });
          units = quantities.reduce((sum, q) => sum + q, 0);
        }
        salesByMonth[month] += units;
      }
    });

    const newChartData = last6Months.map((month) => ({
      month: month.slice(0, 3),
      sales: salesByMonth[month],
    }));

    setChartData(newChartData);

  }, [activeCompanyId]);

  const getBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case "Delivered":
      case "Completed":
      case "Billed":
        return "success";
      case "Working":
        return "secondary";
      case "Pending":
      default:
        return "outline";
    }
  };

  const recentOrders = [...orders].sort((a,b) => (b.createdAt && a.createdAt) ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0).slice(0, 4);

  const totalCustomizedOrders = orders.filter(
    (o) => o.type === "Customized"
  ).length;
  const activeProductions = orders.filter(
    (o) => o.status === "Working" || o.status === "Pending"
  ).length;

  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const unitsSold = deliveredOrders.reduce((acc, order) => {
    if (order.type === "Customized") {
      return acc + 1;
    }
    if (!order.details) {
      return acc;
    }
    const quantities = order.details
      .split("\n")
      .map((line) => {
        const match = line.match(/^(\d+)x/);
        return match ? parseInt(match[1], 10) : 0;
      });
    return acc + quantities.reduce((sum, q) => sum + q, 0);
  }, 0);

  if (!isAuthenticated) {
    return null;
  }
  
  if (isClient && !activeCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Samarth Furniture</CardTitle>
            <CardDescription>To get started, you need to create or select a company.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>All your data, including orders, customers, and inventory, will be organized by company.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/manage-companies')}>Manage Companies</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Customized Orders
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{totalCustomizedOrders}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total customized orders created.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Units Delivered
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{unitsSold}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total units in your delivered orders.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Productions
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{activeProductions}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Your orders in pending or working state.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview (Last 6 Months)</CardTitle>
            <CardDescription>Total units delivered each month across the company.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isClient && !isLoading ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <Skeleton className="h-[300px] w-full" />
            )}
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your most recent orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarImage
                              src={`https://placehold.co/100x100.png`}
                              alt="Avatar"
                              data-ai-hint="person"
                            />
                            <AvatarFallback>
                              {order.customer.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid gap-0.5">
                            <p className="font-medium">{order.customer}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{order.type}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      No recent orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
