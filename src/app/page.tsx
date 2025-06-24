
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Package, Users, CreditCard } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order, OrderStatus } from "@/lib/types";

const ORDERS_STORAGE_KEY = "samarth_furniture_orders";

const chartData = [
  { month: "January", sales: 18623 },
  { month: "February", sales: 30543 },
  { month: "March", sales: 23721 },
  { month: "April", sales: 73234 },
  { month: "May", sales: 55490 },
  { month: "June", sales: 68322 },
];

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

  useEffect(() => {
    setIsClient(true);
    const username = localStorage.getItem("loggedInUser");
    if (!username) {
      router.push("/login");
      return;
    }
    
    setIsAuthenticated(true);
    const role = localStorage.getItem("userRole");
    const savedOrdersRaw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const allOrders: Order[] = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];
    
    let filteredOrders = allOrders;
    if (role === "coordinator") {
        filteredOrders = allOrders.filter(order => order.createdBy === username);
    }
    
    setOrders(filteredOrders);
    setIsLoading(false);
  }, [router]);

  const getBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case "Delivered":
      case "Completed":
        return "success";
      case "Working":
        return "secondary";
      case "Pending":
      default:
        return "outline";
    }
  };

  const recentOrders = orders.slice(0, 4);

  const totalCustomizedOrders = orders.filter(o => o.type === 'Customized').length;
  const activeProductions = orders.filter(o => o.status === 'Working' || o.status === 'Pending').length;
  
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
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
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalCustomizedOrders}</div>}
            <p className="text-xs text-muted-foreground">
              Total customized orders created.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Delivered</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{unitsSold}</div>}
            <p className="text-xs text-muted-foreground">
              Total units in delivered orders.
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
             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{activeProductions}</div>}
            <p className="text-xs text-muted-foreground">
              Orders currently in pending or working state.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isClient ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
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
            <CardDescription>
              Your most recent orders.
            </CardDescription>
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
                      <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarImage src={`https://placehold.co/100x100.png`} alt="Avatar" data-ai-hint="person" />
                            <AvatarFallback>{order.customer.substring(0,2).toUpperCase()}</AvatarFallback>
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
                        <Badge variant={getBadgeVariant(order.status)}>{order.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">No recent orders found.</TableCell>
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
