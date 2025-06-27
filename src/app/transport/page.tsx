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
import { Truck, ShieldAlert, Printer, Armchair } from "lucide-react";
import type { Order, Company } from "@/lib/types";
import { cn } from "@/lib/utils";

const DeliveryReceipt = ({ order, company, addPageBreakBefore = false }: { order: Order, company: Company | null, addPageBreakBefore?: boolean }) => (
    <div className={cn(
        "bg-white text-black p-8 w-full min-h-[297mm] mx-auto shadow-lg print:shadow-none relative",
        addPageBreakBefore && "print-page-break"
      )}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
          <Armchair className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{company?.name || 'Samarth Furniture'}</h1>
            <p className="text-sm text-gray-500">Delivery & Shipping Department</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold uppercase text-gray-700">Delivery Receipt</h2>
          <p className="text-sm">Order ID: <span className="font-medium">{order.id}</span></p>
          <p className="text-sm">Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
        </div>
      </div>
      <Separator className="my-8" />
      
      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Shipping To</h3>
          <p className="font-bold text-lg">{order.customerInfo?.name || order.customer}</p>
          <p className="text-sm break-words">{order.customerInfo?.address || "N/A"}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Transport Details</h3>
          <p className="text-sm"><strong>Driver:</strong> {order.transportDetails?.driverName || 'N/A'}</p>
          <p className="text-sm"><strong>Contact:</strong> {order.transportDetails?.driverContact || 'N/A'}</p>
          <p className="text-sm"><strong>Vehicle:</strong> {order.transportDetails?.vehicleModel ? `${order.transportDetails.vehicleModel} (${order.transportDetails.vehicleNumber})` : 'N/A'}</p>
        </div>
      </div>

      {/* Items Section */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Items Included</h3>
        <div className="whitespace-pre-wrap text-sm break-words border p-4 bg-gray-50 rounded-md min-h-[100px]">
            {order.lineItems && order.lineItems.length > 0
                ? order.lineItems.map(item => `- ${item.quantity}x ${item.description}`).join('\n')
                : (order.details || "No details provided.")
            }
        </div>
      </div>

      {/* Footer & Signatures */}
      <div className="absolute bottom-8 left-8 right-8 print:bottom-8 print:left-8 print:right-8">
        <p className="text-center text-xs text-gray-500 mb-8">Please inspect all items before signing. Your signature confirms that all goods were received in acceptable condition.</p>
        <div className="grid grid-cols-2 gap-16">
          <div className="text-center">
            <Separator className="bg-black mb-2" />
            <p className="text-sm font-semibold">Customer Signature</p>
            <p className="text-xs text-gray-500">Received By</p>
          </div>
          <div className="text-center">
            <Separator className="bg-black mb-2" />
            <p className="text-sm font-semibold">Driver Signature</p>
            <p className="text-xs text-gray-500">Delivered By</p>
          </div>
        </div>
      </div>
    </div>
  );

export default function TransportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [ordersForTransport, setOrdersForTransport] = useState<Order[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);

    if (companyId) {
      const companiesJson = localStorage.getItem('companies');
      const companies: Company[] = companiesJson ? JSON.parse(companiesJson) : [];
      setActiveCompany(companies.find(c => c.id === companyId) || null);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if(!activeCompanyId) return;
    
    setIsLoading(true);
    const ordersJson = localStorage.getItem(`orders_${activeCompanyId}`);
    const allOrders: Order[] = ordersJson ? JSON.parse(ordersJson) : [];
    setOrdersForTransport(allOrders.filter(o => o.status === 'Billed'));
    setIsLoading(false);

  }, [activeCompanyId, toast]);

  const handleDispatchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder || !activeCompanyId) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const transportDetails = {
      driverName: formData.get("driverName") as string,
      driverContact: formData.get("driverContact") as string,
      vehicleNumber: formData.get("vehicleNumber") as string,
      vehicleModel: formData.get("vehicleModel") as string,
    };
    
    const deliveredAt = new Date().toISOString();
    
    const orderUpdates = {
      status: "Delivered" as const,
      transportDetails,
      deliveredAt,
    };
    
    const ordersJson = localStorage.getItem(`orders_${activeCompanyId}`);
    const allOrders: Order[] = ordersJson ? JSON.parse(ordersJson) : [];
    const updatedOrders = allOrders.map(o => o.id === selectedOrder.id ? { ...o, ...orderUpdates } : o);
    localStorage.setItem(`orders_${activeCompanyId}`, JSON.stringify(updatedOrders));

    setOrdersForTransport(updatedOrders.filter(o => o.status === 'Billed'));
    
    toast({
      title: "Order Dispatched!",
      description: `Order ${selectedOrder.id} is on its way and marked as Delivered.`,
    });
    setReceiptOrder({ ...selectedOrder, ...orderUpdates });
    setSelectedOrder(null);
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

  if (!activeCompany) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
            </CardHeader>
            <CardContent><p>Please select or create a company to manage transport.</p></CardContent>
            <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
          </Card>
        </div>
    );
  }

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
              The following orders have been billed and are
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
                          {order.customerInfo?.name || order.customer || "N/A"}
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="no-print">
                <DialogTitle>Print Delivery Receipts</DialogTitle>
                <DialogDescription>
                    Printing two copies: one for the customer and one for the driver.
                </DialogDescription>
            </DialogHeader>
            <div id="printable-area" className="flex-grow overflow-y-auto bg-gray-100 print:bg-white">
                {receiptOrder && <DeliveryReceipt order={receiptOrder} company={activeCompany} />}
                {receiptOrder && <DeliveryReceipt order={receiptOrder} company={activeCompany} addPageBreakBefore={true} />}
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
