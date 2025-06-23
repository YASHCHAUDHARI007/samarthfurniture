
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OrderStatus = "Pending" | "Working" | "Completed" | "Delivered";

type Order = {
  id: string;
  customer: string;
  item: string;
  status: OrderStatus;
};

const initialOrders: Order[] = [
    { id: "ORD-001", customer: "Olivia Martin", item: "Custom Oak Bookshelf", status: "Working" },
    { id: "ORD-002", customer: "Jackson Lee", item: "Minimalist Coffee Table", status: "Pending" },
    { id: "ORD-003", customer: "FineNests Inc.", item: "Bulk Order: 50x Dining Chairs", status: "Completed" },
    { id: "ORD-004", customer: "William Kim", item: "Floating Wall Shelf", status: "Delivered" },
    { id: "ORD-005", customer: "Ava Garcia", item: "Velvet Upholstered Armchair", status: "Pending" },
    { id: "ORD-006", customer: "Modern Furnishings Co.", item: "Bulk Order: 20x Modular 'L' Sofa", status: "Working" },
];

export default function FactoryDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isFactoryWorker, setIsFactoryWorker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser?.includes("factory")) {
      setIsFactoryWorker(true);
    } else {
      setIsFactoryWorker(false);
    }
    setIsLoading(false);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    toast({
      title: "Status Updated",
      description: `Order ${orderId} status changed to ${newStatus}.`,
    });
  };
  
  const getStatusBadgeVariant = (status: OrderStatus): BadgeProps["variant"] => {
      switch (status) {
          case "Delivered":
              return "success";
          case "Completed":
              return "default";
          case "Working":
              return "secondary";
          case "Pending":
          default:
              return "outline";
      }
  }

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (!isFactoryWorker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="text-destructive" /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              You do not have permission to view this page. Please log in as a
              factory worker.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/login")}>
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <Factory className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Factory Dashboard</h2>
      </div>
      <p className="text-muted-foreground">
        View and update the status of current production orders.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Production Orders</CardTitle>
          <CardDescription>
            A list of all orders currently in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item Description</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead className="w-[180px]">Change Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.item}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(newStatus: OrderStatus) =>
                          handleStatusChange(order.id, newStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Set status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Working">Working</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
