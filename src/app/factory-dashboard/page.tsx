
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";

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
  customerInfo: {
    name: string;
    email?: string;
    address?: string;
    dealerId?: string;
  };
};

const ORDERS_STORAGE_KEY = "furnishflow_orders";

const initialOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "Olivia Martin",
    item: "Custom Oak Bookshelf",
    status: "Working",
    type: "Customer",
    details:
      "A custom-built bookshelf made from solid oak, with a dark walnut stain. Dimensions are non-standard to fit a specific alcove. Features 5 shelves, with the top two having a smaller depth.",
    dimensions: { height: "84", width: "40", depth: "12" },
    customerInfo: {
      name: "Olivia Martin",
      email: "olivia.martin@email.com",
      address: "456 Oak Avenue, Springfield, IL 62704",
    },
  },
  {
    id: "ORD-003",
    customer: "FineNests Inc.",
    item: "Bulk Order: 50x Dining Chairs",
    status: "Completed",
    type: "Dealer",
    details: "50x Upholstered Dining Chair (CHR-DIN-UPH-BGE)",
    customerInfo: {
      name: "FineNests Inc.",
      dealerId: "DEALER-FN-458",
    },
  },
];

export default function FactoryDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isFactoryWorker, setIsFactoryWorker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "factory") {
      setIsFactoryWorker(true);
    } else {
      setIsFactoryWorker(false);
    }

    const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      setOrders(initialOrders);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initialOrders));
    }

    setIsLoading(false);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    toast({
      title: "Status Updated",
      description: `Order ${orderId} status changed to ${newStatus}.`,
    });
  };

  const getStatusBadgeVariant = (
    status: OrderStatus
  ): BadgeProps["variant"] => {
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
  };

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
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <Factory className="h-7 w-7" />
          <h2 className="text-3xl font-bold tracking-tight">
            Factory Dashboard
          </h2>
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
                    <TableHead>Item Summary</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead className="w-[180px]">Change Status</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
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
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedOrder && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedOrder(null);
          }}
        >
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Order Details: {selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Full specification for{" "}
                {selectedOrder.type === "Customer"
                  ? "a custom order."
                  : "a bulk dealer order."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold">Customer Information</h4>
                <p>
                  <strong>Name:</strong> {selectedOrder.customerInfo.name}
                </p>
                {selectedOrder.customerInfo.email && (
                  <p>
                    <strong>Email:</strong> {selectedOrder.customerInfo.email}
                  </p>
                )}
                {selectedOrder.customerInfo.address && (
                  <p>
                    <strong>Address:</strong>{" "}
                    {selectedOrder.customerInfo.address}
                  </p>
                )}
                {selectedOrder.customerInfo.dealerId && (
                  <p>
                    <strong>Dealer ID:</strong>{" "}
                    {selectedOrder.customerInfo.dealerId}
                  </p>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold">Order Specification</h4>
                <p className="whitespace-pre-wrap">{selectedOrder.details}</p>
              </div>

              {selectedOrder.dimensions &&
                (selectedOrder.dimensions.height ||
                  selectedOrder.dimensions.width ||
                  selectedOrder.dimensions.depth) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-semibold">Dimensions</h4>
                      <div className="flex gap-4">
                        {selectedOrder.dimensions.height && (
                          <p>
                            <strong>Height:</strong>{" "}
                            {selectedOrder.dimensions.height} in
                          </p>
                        )}
                        {selectedOrder.dimensions.width && (
                          <p>
                            <strong>Width:</strong>{" "}
                            {selectedOrder.dimensions.width} in
                          </p>
                        )}
                        {selectedOrder.dimensions.depth && (
                          <p>
                            <strong>Depth:</strong>{" "}
                            {selectedOrder.dimensions.depth} in
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

              {selectedOrder.photoDataUrl && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold">Design Photo</h4>
                    <div className="relative w-full aspect-video rounded-md overflow-hidden">
                       <Image
                          src={selectedOrder.photoDataUrl}
                          alt="Order Design Photo"
                          layout="fill"
                          objectFit="contain"
                       />
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
