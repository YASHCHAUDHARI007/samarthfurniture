
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, ShieldAlert, History, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

type OrderStatus = "Pending" | "Working" | "Completed" | "Delivered";

type Order = {
  id: string;
  customer: string;
  item: string;
  status: OrderStatus;
  type: "Customized" | "Dealer";
  details: string;
  createdBy?: string;
  dimensions?: {
    height?: string;
    width?: string;
    depth?: string;
  };
  dimensionDetails?: string;
  photoDataUrl?: string;
  customerInfo?: {
    name: string;
    email?: string;
    address?: string;
    dealerId?: string;
  };
  transportDetails?: {
    driverName: string;
    driverContact: string;
    vehicleNumber: string;
    vehicleModel: string;
  };
};

const ORDERS_STORAGE_KEY = "furnishflow_orders";

const initialOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "Olivia Martin",
    item: "Custom Oak Bookshelf",
    status: "Working",
    type: "Customized",
    details:
      "A custom-built bookshelf made from solid oak, with a dark walnut stain. Features 5 shelves, with the top two having a smaller depth.",
    createdBy: "coordinator",
    dimensions: { height: "84", width: "40", depth: "12" },
    dimensionDetails: "Top two shelves should be 10in deep, bottom three should be 12in deep. Back panel should have a 2in diameter hole for cables, centered, 6in from the bottom.",
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
    status: "Delivered",
    type: "Dealer",
    details: "50x Upholstered Dining Chair (CHR-DIN-UPH-BGE)",
    createdBy: "owner",
    customerInfo: {
      name: "FineNests Inc.",
      dealerId: "DEALER-FN-458",
    },
  },
];

export default function FactoryDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("loggedInUser");
    
    if (role === "factory" || role === "owner" || role === "coordinator") {
      setHasAccess(true);
    }
    if (role === "factory" || role === "owner") {
      setCanEdit(true);
    }

    let allOrders: Order[] = [];
    const savedOrdersRaw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (savedOrdersRaw) {
      allOrders = JSON.parse(savedOrdersRaw);
    }

    if (allOrders.length === 0) {
        allOrders = initialOrders;
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initialOrders));
    }
    
    let filteredOrders = allOrders;
    if (role === "coordinator") {
        filteredOrders = allOrders.filter(order => order.createdBy === username);
    }

    setOrders(filteredOrders);
    setIsLoading(false);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    
    // Also update the master list in localStorage
    const allOrdersRaw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const allOrders = allOrdersRaw ? JSON.parse(allOrdersRaw) : [];
    const updatedAllOrders = allOrders.map((order: Order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedAllOrders));

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

  if (!hasAccess) {
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
              You do not have permission to view this page. Please log in with an authorized account.
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
  
  const activeOrders = orders.filter(
    (order) => order.status === "Pending" || order.status === "Working"
  );
  
  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  );

  const filteredDeliveredOrders = deliveredOrders.filter(order => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          View and update the status of production orders.
        </p>

        <Tabs defaultValue="production">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 max-w-md">
            <TabsTrigger value="production">
              <Factory className="mr-2 h-4 w-4" />
              Production Orders
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Order History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="production">
            <Card>
              <CardHeader>
                <CardTitle>Production Orders</CardTitle>
                <CardDescription>
                  A list of all orders currently in production.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead className="hidden md:table-cell">Customer</TableHead>
                        <TableHead className="hidden md:table-cell">Item Summary</TableHead>
                        <TableHead>Current Status</TableHead>
                        {canEdit && <TableHead className="w-[180px]">Change Status</TableHead>}
                        <TableHead className="w-[140px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.id}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{order.customer}</TableCell>
                          <TableCell className="hidden md:table-cell">{order.item}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(order.status)}
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          {canEdit && (
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
                                  <SelectItem value="Completed">
                                    Completed
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
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
          </TabsContent>
          <TabsContent value="history">
            <Card>
                <CardHeader>
                    <CardTitle>Delivered Order History</CardTitle>
                    <CardDescription>A searchable archive of all delivered orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-sm">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input
                           placeholder="Search by ID, customer, item..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="pl-9"
                         />
                        </div>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                                    <TableHead className="hidden md:table-cell">Item Summary</TableHead>
                                    <TableHead>Final Status</TableHead>
                                    <TableHead className="w-[140px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDeliveredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell className="hidden md:table-cell">{order.customer}</TableCell>
                                        <TableCell className="hidden md:table-cell">{order.item}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(order.status)}>
                                                {order.status}
                                            </Badge>
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
          </TabsContent>
        </Tabs>
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
                {selectedOrder.type === "Customized"
                  ? "a custom order."
                  : "a bulk dealer order."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              {selectedOrder.customerInfo && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold">Customer Information</h4>
                    <p>
                      <strong>Name:</strong> {selectedOrder.customerInfo.name}
                    </p>
                    {selectedOrder.customerInfo.email && (
                      <p>
                        <strong>Email:</strong>{" "}
                        {selectedOrder.customerInfo.email}
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
                </>
              )}
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
                      <h4 className="font-semibold">Overall Dimensions</h4>
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

              {selectedOrder.dimensionDetails && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold">Additional Measurement Details</h4>
                    <p className="whitespace-pre-wrap text-sm">{selectedOrder.dimensionDetails}</p>
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
                          fill
                          style={{objectFit: 'contain'}}
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
