
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Truck, ShieldAlert } from "lucide-react";

type OrderStatus = "Pending" | "Working" | "Completed" | "Delivered";

type Order = {
  id: string;
  customer: string;
  item: string;
  status: OrderStatus;
  type: "Customer" | "Dealer";
  details: string;
  dimensions?: {
    height?: string;
    width?: string;
    depth?: string;
  };
  photoDataUrl?: string;
  customerInfo?: {
    name: string;
    email?: string;
    address?: string;
    dealerId?: string;
  };
};

const ORDERS_STORAGE_KEY = "furnishflow_orders";

export default function TransportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);

    const savedOrdersRaw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const savedOrders = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];
    setOrders(savedOrders);

    setIsLoading(false);
  }, []);

  const handleMarkAsDelivered = (orderId: string) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: "Delivered" } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    toast({
      title: "Order Shipped!",
      description: `Order ${orderId} has been marked as Delivered and will now appear in the factory history.`,
    });
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (userRole !== "owner" && userRole !== "factory") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="text-destructive" /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view this page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const ordersForTransport = orders.filter(
    (order) => order.status === "Completed"
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <Truck className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">
          Transport & Shipping
        </h2>
      </div>
      <p className="text-muted-foreground">
        Manage and track orders that are ready for delivery.
      </p>
      <Separator />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ready for Shipping</CardTitle>
          <CardDescription>
            The following orders have been marked as 'Completed' and are
            awaiting transport.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Shipping Address</TableHead>
                  {userRole === "factory" && (
                    <TableHead className="w-[200px] text-right">
                      Action
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersForTransport.length > 0 ? (
                  ordersForTransport.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        {order.customerInfo?.name || order.customer}
                      </TableCell>
                      <TableCell>
                        {order.customerInfo?.address || "N/A"}
                      </TableCell>
                      {userRole === "factory" && (
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsDelivered(order.id)}
                          >
                            Mark as Delivered
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={userRole === "factory" ? 4 : 3}
                      className="h-24 text-center"
                    >
                      No orders are currently awaiting transport.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
