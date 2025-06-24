
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck, ShieldAlert, Printer } from "lucide-react";
import type { Order } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";


const DeliveryReceipt = ({ order }: { order: Order }) => (
    <div className="border p-4 rounded-lg space-y-4">
      <div className="text-center">
        <h3 className="font-bold text-lg">Delivery Receipt</h3>
        <p className="text-sm">Order ID: {order.id}</p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Customer Details</h4>
          <p>{order.customerInfo?.name || order.customer}</p>
          <p className="text-sm break-words">{order.customerInfo?.address || "N/A"}</p>
        </div>
        <div>
          <h4 className="font-semibold">Driver & Vehicle</h4>
          <p>Driver: {order.transportDetails?.driverName || 'N/A'}</p>
          <p className="text-sm">Contact: {order.transportDetails?.driverContact || 'N/A'}</p>
          <p className="text-sm">Vehicle: {order.transportDetails?.vehicleModel ? `${order.transportDetails.vehicleModel} (${order.transportDetails.vehicleNumber})` : 'N/A'}</p>
        </div>
      </div>
       <div className="space-y-2">
        <h4 className="font-semibold">Order Items / Details</h4>
        <p className="whitespace-pre-wrap text-xs break-words border p-2 bg-muted/50 rounded-md min-h-[50px]">
            {order.details || "No details provided."}
        </p>
      </div>
      <div className="pt-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <Separator className="bg-foreground" />
            <p className="text-center text-sm pt-2">Customer Signature</p>
          </div>
          <div>
            <Separator className="bg-foreground" />
            <p className="text-center text-sm pt-2">Driver Signature</p>
          </div>
        </div>
      </div>
    </div>
  );

export default function TransportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("loggedInUser");
    setUserRole(role);

    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "orders"), where("status", "==", "Completed"));
        const querySnapshot = await getDocs(q);
        let ordersToDisplay = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id})) as Order[];
        
        if (role === "coordinator") {
          ordersToDisplay = ordersToDisplay.filter(order => order.createdBy === username);
        }
        
        setOrders(ordersToDisplay);
      } catch (error) {
        console.error("Error fetching orders for transport: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch orders." });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [toast]);

  const handleDispatchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const transportDetails = {
      driverName: formData.get("driverName") as string,
      driverContact: formData.get("driverContact") as string,
      vehicleNumber: formData.get("vehicleNumber") as string,
      vehicleModel: formData.get("vehicleModel") as string,
    };

    const deliveredAt = new Date().toISOString();
    let updatedOrder: Order | undefined;
    
    try {
      const orderRef = doc(db, "orders", selectedOrder.id);
      await updateDoc(orderRef, {
        status: "Delivered",
        transportDetails,
        deliveredAt,
      });

      updatedOrder = { ...selectedOrder, status: "Delivered", transportDetails, deliveredAt };

      setOrders(orders.filter((o) => o.id !== selectedOrder.id));
      
      toast({
        title: "Order Dispatched!",
        description: `Order ${selectedOrder.id} is on its way and marked as Delivered.`,
      });

      setReceiptOrder(updatedOrder || null);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error dispatching order: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not dispatch the order." });
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (userRole !== "owner" && userRole !== "factory" && userRole !== "coordinator" && userRole !== "administrator") {
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

  const ordersForTransport = orders;
  const canDispatch = userRole === "factory" || userRole === "owner" || userRole === "administrator";

  return (
    <>
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
                    {canDispatch && (
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
                        {canDispatch && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              Dispatch Order
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={canDispatch ? 4 : 3}
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

      <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispatch Order: {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Enter driver and vehicle details to mark this order as delivered.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDispatchSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driverName">Driver Name</Label>
                  <Input id="driverName" name="driverName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverContact">Driver Contact</Label>
                  <Input id="driverContact" name="driverContact" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                  <Input id="vehicleNumber" name="vehicleNumber" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleModel">Vehicle Model</Label>
                  <Input id="vehicleModel" name="vehicleModel" required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Mark as Delivered & Get Receipt</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!receiptOrder} onOpenChange={(isOpen) => !isOpen && setReceiptOrder(null)}>
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle>Print Delivery Receipts</DialogTitle>
                <DialogDescription>
                    Print two copies of the receipt: one for the customer and one for the driver.
                </DialogDescription>
            </DialogHeader>
            <div id="printable-area" className="space-y-6 py-4">
                {receiptOrder && <DeliveryReceipt order={receiptOrder} />}
                <Separator/>
                {receiptOrder && <DeliveryReceipt order={receiptOrder} />}
            </div>
            <DialogFooter className="no-print">
                 <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print Receipts
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
