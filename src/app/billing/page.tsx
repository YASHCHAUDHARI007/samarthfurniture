
"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Receipt, ShieldAlert, Trash2, Printer } from "lucide-react";
import type { Order, LineItem } from "@/lib/types";

const Invoice = ({ order }: { order: Order }) => (
    <div className="border p-4 rounded-lg space-y-4 text-sm">
      <div className="text-center">
        <h3 className="font-bold text-lg">Tax Invoice</h3>
        <p className="text-xs">Invoice #: {order.invoiceNumber}</p>
        <p className="text-xs">Date: {order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString() : 'N/A'}</p>
      </div>
      <Separator />
       <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Billed To</h4>
          <p>{order.customerInfo?.name || order.customer}</p>
          <p className="text-xs break-words">{order.customerInfo?.address || "N/A"}</p>
          <p className="text-xs break-words">{order.customerInfo?.email || ""}</p>
        </div>
        <div className="text-right">
            <h4 className="font-semibold">Samarth Furniture</h4>
            <p className="text-xs">123 Furniture Lane</p>
            <p className="text-xs">Anytown, ST 12345</p>
            <p className="text-xs">contact@samarthfurniture.com</p>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <h4 className="font-semibold">Order Summary</h4>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Item Description</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {order.lineItems?.map(item => (
                    <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{(item.quantity * item.price).toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
       <Separator />
       <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                    <span className="font-semibold">Subtotal</span>
                    <span>{order.subTotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold">GST ({order.gstRate}%)</span>
                    <span>{order.gstAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
            </div>
       </div>

      <div className="pt-16">
        <Separator className="bg-foreground" />
        <p className="text-center text-xs pt-2">Authorized Signatory</p>
      </div>
    </div>
);


export default function BillingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [gstRate, setGstRate] = useState(18);

    useEffect(() => {
        const role = localStorage.getItem("userRole");
        if (role === "owner" || role === "coordinator" || role === "administrator") {
          setHasAccess(true);
        }
        
        const allOrders: Order[] = JSON.parse(localStorage.getItem('samarth_furniture_orders') || '[]');
        const completedOrders = allOrders.filter(o => o.status === 'Completed');
        setOrders(completedOrders);
        setIsLoading(false);
    }, []);

    const handleSelectOrder = (order: Order) => {
        if (order.type === 'Dealer') {
            const items = order.details.split('\n').map((line, index) => {
                const match = line.match(/(\d+)x\s(.*?)\s\((.*?)\)/);
                if (match) {
                    const quantity = parseInt(match[1], 10);
                    const name = match[2];
                    const sku = match[3];
                    return { id: `line-${index}`, description: `${name} (${sku})`, quantity, price: 0 };
                }
                return null;
            }).filter((item): item is LineItem => item !== null);
            setLineItems(items);
        } else { // Customized order
            setLineItems([{ id: `line-0`, description: order.item, quantity: 1, price: 0 }]);
        }
        setSelectedOrder(order);
    };

    const handleLineItemChange = (id: string, field: 'description' | 'quantity' | 'price', value: string) => {
        setLineItems(currentItems => currentItems.map(item => {
            if (item.id === id) {
                const newValue = field === 'description' ? value : parseFloat(value) || 0;
                return { ...item, [field]: newValue };
            }
            return item;
        }));
    };

    const addLineItem = () => {
        setLineItems(current => [...current, {id: `line-${Date.now()}`, description: '', quantity: 1, price: 0}]);
    };

    const removeLineItem = (id: string) => {
        setLineItems(current => current.filter(item => item.id !== id));
    };

    const { subTotal, gstAmount, totalAmount } = useMemo(() => {
        const subTotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        const gstAmount = subTotal * (gstRate / 100);
        const totalAmount = subTotal + gstAmount;
        return { subTotal, gstAmount, totalAmount };
    }, [lineItems, gstRate]);

    const handleGenerateInvoice = () => {
        if (!selectedOrder) return;
        
        const invoiceDate = new Date().toISOString();
        const invoiceNumber = `INV-${new Date().getTime()}`;

        const updatedOrder: Order = {
            ...selectedOrder,
            status: "Billed",
            lineItems,
            subTotal,
            gstRate,
            gstAmount,
            totalAmount,
            invoiceNumber,
            invoiceDate
        };
        
        const allOrders: Order[] = JSON.parse(localStorage.getItem('samarth_furniture_orders') || '[]');
        const updatedOrders = allOrders.map(o => o.id === selectedOrder.id ? updatedOrder : o);
        localStorage.setItem('samarth_furniture_orders', JSON.stringify(updatedOrders));

        setOrders(currentOrders => currentOrders.filter(o => o.id !== selectedOrder.id));
        setInvoiceOrder(updatedOrder);
        setSelectedOrder(null);
        toast({ title: "Invoice Generated", description: `Order ${selectedOrder.id} is now billed.` });
    };

    const handlePrint = () => {
        window.print();
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
                <CardContent><p>You do not have permission to view this page.</p></CardContent>
                <CardFooter><Button onClick={() => router.push("/")}>Return to Dashboard</Button></CardFooter>
              </Card>
            </div>
        );
    }
    
    return (
        <>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center gap-2">
                <Receipt className="h-7 w-7" />
                <h2 className="text-3xl font-bold tracking-tight">Billing & Invoicing</h2>
            </div>
            <p className="text-muted-foreground">
                Generate invoices for completed orders.
            </p>
            <Separator />

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Orders Ready for Billing</CardTitle>
                    <CardDescription>
                        The following orders are marked 'Completed' and are ready to be invoiced.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Order Type</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length > 0 ? orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>{order.customer}</TableCell>
                                        <TableCell>{order.type}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleSelectOrder(order)}>Create Invoice</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No orders are awaiting billing.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Create Invoice for Order: {selectedOrder?.id}</DialogTitle>
                    <DialogDescription>Add pricing details to generate the final invoice.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-24">Quantity</TableHead>
                                <TableHead className="w-32">Price/Unit</TableHead>
                                <TableHead className="w-32 text-right">Total</TableHead>
                                {selectedOrder?.type === "Customized" && <TableHead className="w-12"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {selectedOrder?.type === 'Customized' ? (
                                            <Input value={item.description} onChange={e => handleLineItemChange(item.id, 'description', e.target.value)} />
                                        ) : item.description}
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" value={item.quantity} onChange={e => handleLineItemChange(item.id, 'quantity', e.target.value)} min="1"/>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" value={item.price} onChange={e => handleLineItemChange(item.id, 'price', e.target.value)} min="0" placeholder="0.00"/>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {(item.quantity * item.price).toFixed(2)}
                                    </TableCell>
                                    {selectedOrder?.type === 'Customized' && (
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)} className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {selectedOrder?.type === 'Customized' && (
                        <Button variant="outline" size="sm" onClick={addLineItem}>Add Line Item</Button>
                    )}
                </div>
                <Separator />
                 <div className="flex justify-end pt-4">
                    <div className="w-full max-w-sm space-y-4">
                         <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="gstRate" className="whitespace-nowrap">GST Rate (%)</Label>
                            <Input id="gstRate" type="number" value={gstRate} onChange={e => setGstRate(parseFloat(e.target.value) || 0)} className="w-24"/>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Subtotal</span>
                            <span>{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">GST ({gstRate}%)</span>
                            <span>{gstAmount.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount</span>
                            <span>₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleGenerateInvoice} disabled={!totalAmount}>Generate Invoice</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={!!invoiceOrder} onOpenChange={(isOpen) => !isOpen && setInvoiceOrder(null)}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Invoice Generated Successfully</DialogTitle>
                    <DialogDescription>Print two copies: one for the customer and one for your records.</DialogDescription>
                </DialogHeader>
                <div id="printable-area" className="py-4">
                    {invoiceOrder && <Invoice order={invoiceOrder} />}
                </div>
                <DialogFooter className="no-print">
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Invoice</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
