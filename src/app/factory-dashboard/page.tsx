
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
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
import { Factory, ShieldAlert, History, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import type { Order, OrderStatus, StockItem, StockStatus, PaymentStatus } from "@/lib/types";

export default function FactoryDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const getCompanyStorageKey = (baseKey: string) => {
    if (!activeCompanyId) return null;
    return `samarth_furniture_${activeCompanyId}_${baseKey}`;
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    
    if (role === "factory" || role === "owner" || role === "coordinator" || role === "administrator") {
      setHasAccess(true);
    }
    if (role === "factory" || role === "owner" || role === "administrator") {
      setCanEdit(true);
    }

    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!activeCompanyId) {
        setOrders([]);
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    const ordersKey = getCompanyStorageKey('orders')!;
    let allOrders: Order[] = JSON.parse(localStorage.getItem(ordersKey) || "[]");

    const username = localStorage.getItem("loggedInUser");
    const role = localStorage.getItem("userRole");
    if (role === "coordinator" && username) {
      allOrders = allOrders.filter(order => order.createdBy === username);
    }
    setOrders(allOrders);
    setIsLoading(false);
  }, [activeCompanyId, userRole]);

  const getStockStatus = (quantity: number, reorderLevel: number): StockStatus => {
    if (quantity === 0) return "Out of Stock";
    if (quantity > 0 && quantity <= reorderLevel) return "Low Stock";
    return "In Stock";
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder || !activeCompanyId) return;
    
    const ordersKey = getCompanyStorageKey('orders')!;
    const stockKey = getCompanyStorageKey('stock_items')!;
    
    const allOrders: Order[] = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    let stockItems: StockItem[] = JSON.parse(localStorage.getItem(stockKey) || '[]');
    let stockUpdated = false;

    // Stock deduction logic
    if (newStatus === 'Completed' && originalOrder.type === 'Dealer' && !originalOrder.stockDeducted) {
        const orderLines = originalOrder.details.split('\n');
        for (const line of orderLines) {
            const match = line.match(/(\d+)x\s.*?\((.*?)\)/); // e.g. "10x Modern Sofa (SOF-MOD-BLU)"
            if (match) {
                const quantityToDeduct = parseInt(match[1], 10);
                const sku = match[2]; // Extracts the SKU from parenthesis
                
                const stockItemIndex = stockItems.findIndex(item => item.sku === sku);
                if (stockItemIndex !== -1) {
                    const currentItem = stockItems[stockItemIndex];
                    const newQuantity = Math.max(0, currentItem.quantity - quantityToDeduct);
                    stockItems[stockItemIndex] = { 
                        ...currentItem, 
                        quantity: newQuantity,
                        status: getStockStatus(newQuantity, currentItem.reorderLevel)
                    };
                    stockUpdated = true;
                }
            }
        }
    }
    
    const updatedOrders = allOrders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus, stockDeducted: newStatus === 'Completed' ? true : order.stockDeducted } : order
    );

    let userOrders = updatedOrders;
    if (userRole === "coordinator") {
      const username = localStorage.getItem("loggedInUser");
      userOrders = updatedOrders.filter(order => order.createdBy === username);
    }
    setOrders(userOrders);
    localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));

    if (stockUpdated) {
        localStorage.setItem(stockKey, JSON.stringify(stockItems));
        toast({ title: 'Stock Updated', description: 'Inventory levels have been automatically adjusted.' });
    }

    toast({
      title: "Status Updated",
      description: `Order ${orderId} status changed to ${newStatus}.`,
    });
  };

  const handleDeleteOrder = () => {
    if (!orderToDelete || !activeCompanyId) return;
    
    const ordersKey = getCompanyStorageKey('orders')!;
    const allOrders: Order[] = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    const updatedOrders = allOrders.filter((order) => order.id !== orderToDelete.id);
    
    let userOrders = updatedOrders;
    if (userRole === "coordinator") {
      const username = localStorage.getItem("loggedInUser");
      userOrders = updatedOrders.filter(order => order.createdBy === username);
    }
    setOrders(userOrders);
    localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));

    toast({
      title: "Order Deleted",
      description: `Order ${orderToDelete.id} has been permanently deleted.`,
      variant: "destructive"
    });
    setOrderToDelete(null);
  };

  const getStatusBadgeVariant = (status: OrderStatus): BadgeProps["variant"] => {
    switch (status) {
      case "Delivered":
        return "success";
      case "Completed":
      case "Billed":
        return "default";
      case "Working":
        return "secondary";
      case "Pending":
      default:
        return "outline";
    }
  };

  const getPaymentStatusVariant = (status?: PaymentStatus): BadgeProps["variant"] => {
    switch (status) {
        case "Paid": return "success";
        case "Partially Paid": return "secondary";
        case "Unpaid": return "destructive";
        default: return "outline";
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
  
  if (!activeCompanyId) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
            </CardHeader>
            <CardContent><p>Please select or create a company to manage factory operations.</p></CardContent>
            <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
          </Card>
        </div>
    );
  }
  
  const activeOrders = orders.filter(
    (order) => order.status === "Pending" || order.status === "Working"
  );
  
  const completedOrders = orders.filter(
    (order) => order.status === "Completed"
  );

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered" || order.status === "Billed"
  );

  const filteredHistoryOrders = [...completedOrders, ...deliveredOrders].filter(order => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (b.invoiceDate && a.invoiceDate) ? new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime() : 0);
  
  const canDelete = userRole === "administrator";

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
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                     {activeOrders.length > 0 ? activeOrders.map((order) => (
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
                      )) : (
                        <TableRow>
                            <TableCell colSpan={canEdit ? 6 : 5} className="h-24 text-center">No active production orders.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
                <CardHeader>
                    <CardTitle>Completed & Delivered Order History</CardTitle>
                    <CardDescription>A searchable archive of all completed and delivered orders.</CardDescription>
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
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Order Status</TableHead>
                                    <TableHead>Payment Status</TableHead>
                                    <TableHead>Details</TableHead>
                                    {canDelete && <TableHead className="text-right">Delete</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHistoryOrders.length > 0 ? filteredHistoryOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.invoiceNumber || order.id}</TableCell>
                                        <TableCell>{order.customer}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {order.paymentStatus ? (
                                                <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                                                    {order.paymentStatus}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">N/A</Badge>
                                            )}
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
                                        {canDelete && (
                                          <TableCell className="text-right">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="text-muted-foreground hover:text-destructive"
                                              onClick={() => setOrderToDelete(order)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete Order</span>
                                            </Button>
                                          </TableCell>
                                        )}
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={canDelete ? 6 : 5} className="h-24 text-center">No historical orders found.</TableCell>
                                    </TableRow>
                                )}
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

      <AlertDialog open={!!orderToDelete} onOpenChange={(isOpen) => !isOpen && setOrderToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete order
                    <span className="font-semibold"> {orderToDelete?.id} </span>
                    and all of its data.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDeleteOrder}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
