
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Receipt, ShieldAlert, Trash2, Printer, IndianRupee, Search } from "lucide-react";
import type { Order, LineItem, Payment, PaymentStatus, LedgerEntry } from "@/lib/types";
import { Invoice } from "@/components/invoice";


export default function BillingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
    const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [gstRate, setGstRate] = useState(18);

    const [paymentAmount, setPaymentAmount] = useState<number | "">("");
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Other'>('UPI');

    const [searchTerm, setSearchTerm] = useState("");
    const [isReprintView, setIsReprintView] = useState(false);


    const fetchOrders = () => {
        const storedOrders: Order[] = JSON.parse(localStorage.getItem('samarth_furniture_orders') || '[]');
        setAllOrders(storedOrders);
    };

    useEffect(() => {
        const role = localStorage.getItem("userRole");
        if (role === "owner" || role === "coordinator" || role === "administrator" || role === "factory") {
          setHasAccess(true);
        }
        fetchOrders();
        setIsLoading(false);
    }, []);

    const handleSelectOrder = (order: Order) => {
        if (order.type === 'Dealer') {
            const items = order.details.split('\n').map((line, index) => {
                const match = line.match(/(\d+)x\s(.*?)\s\(SKU: (.*?)\)/);
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
        if (!selectedOrder || !selectedOrder.customerInfo) return;
        
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
            invoiceDate,
            payments: [],
            paidAmount: 0,
            balanceDue: totalAmount,
            paymentStatus: totalAmount > 0 ? "Unpaid" : "Paid",
        };
        
        const storedOrders: Order[] = JSON.parse(localStorage.getItem('samarth_furniture_orders') || '[]');
        const updatedOrders = storedOrders.map(o => o.id === selectedOrder.id ? updatedOrder : o);
        localStorage.setItem('samarth_furniture_orders', JSON.stringify(updatedOrders));

        // Create Ledger Entry for Sale
        const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem('samarth_furniture_ledger') || '[]');
        const customerDebitEntry: LedgerEntry = {
            id: `LEDG-${Date.now()}-D`,
            date: invoiceDate,
            accountId: selectedOrder.customerInfo.id,
            accountName: selectedOrder.customerInfo.name,
            type: 'Sales',
            details: `Invoice ${invoiceNumber}`,
            debit: totalAmount,
            credit: 0,
            refId: selectedOrder.id,
        };
        const salesCreditEntry: LedgerEntry = {
            id: `LEDG-${Date.now()}-C`,
            date: invoiceDate,
            accountId: 'SALES_ACCOUNT',
            accountName: 'Sales Account',
            type: 'Sales',
            details: `Against Inv ${invoiceNumber} to ${selectedOrder.customerInfo.name}`,
            debit: 0,
            credit: totalAmount,
            refId: selectedOrder.id,
        };
        ledgerEntries.push(customerDebitEntry, salesCreditEntry);
        localStorage.setItem('samarth_furniture_ledger', JSON.stringify(ledgerEntries));


        fetchOrders();
        setInvoiceOrder(updatedOrder);
        setIsReprintView(false);
        setSelectedOrder(null);
        toast({ title: "Invoice Generated", description: `Order ${selectedOrder.id} is now billed.` });
    };

    const handleRecordPayment = () => {
        if (!paymentOrder || !paymentAmount || paymentAmount <= 0) {
            toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid payment amount."});
            return;
        }

        const paymentDate = new Date().toISOString();
        const newPayment: Payment = {
            id: `PAY-${Date.now()}`,
            date: paymentDate,
            amount: Number(paymentAmount),
            method: paymentMethod
        };
        
        const existingPayments = paymentOrder.payments || [];
        const updatedPayments = [...existingPayments, newPayment];
        const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
        const balanceDue = (paymentOrder.totalAmount || 0) - totalPaid;
        
        let paymentStatus: PaymentStatus = 'Partially Paid';
        if (balanceDue <= 0) {
            paymentStatus = 'Paid';
        }

        const updatedOrder: Order = {
            ...paymentOrder,
            payments: updatedPayments,
            paidAmount: totalPaid,
            balanceDue: balanceDue,
            paymentStatus: paymentStatus
        };

        const storedOrders: Order[] = JSON.parse(localStorage.getItem('samarth_furniture_orders') || '[]');
        const updatedOrders = storedOrders.map(o => o.id === paymentOrder.id ? updatedOrder : o);
        localStorage.setItem('samarth_furniture_orders', JSON.stringify(updatedOrders));

         // Create Ledger Entry for Receipt
        const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem('samarth_furniture_ledger') || '[]');
        const customerCreditEntry: LedgerEntry = {
            id: `LEDG-${Date.now()}-C`,
            date: paymentDate,
            accountId: paymentOrder.customerInfo!.id,
            accountName: paymentOrder.customerInfo!.name,
            type: 'Receipt',
            details: `Payment via ${paymentMethod} for ${paymentOrder.invoiceNumber}`,
            debit: 0,
            credit: Number(paymentAmount),
            refId: newPayment.id,
        };
        const cashDebitEntry: LedgerEntry = {
            id: `LEDG-${Date.now()}-D`,
            date: paymentDate,
            accountId: 'CASH_BANK_ACCOUNT',
            accountName: 'Cash/Bank Account',
            type: 'Receipt',
            details: `From ${paymentOrder.customerInfo!.name}`,
            debit: Number(paymentAmount),
            credit: 0,
            refId: newPayment.id,
        };
        ledgerEntries.push(customerCreditEntry, cashDebitEntry);
        localStorage.setItem('samarth_furniture_ledger', JSON.stringify(ledgerEntries));
        
        fetchOrders();
        setPaymentOrder(null);
        setPaymentAmount("");
        toast({ title: "Payment Recorded", description: `Payment of ₹${paymentAmount} recorded for order ${paymentOrder.id}.`});
    };

    const getPaymentStatusVariant = (status?: PaymentStatus): BadgeProps["variant"] => {
        switch (status) {
          case "Paid":
            return "success";
          case "Partially Paid":
            return "secondary";
          case "Unpaid":
            return "destructive";
          default:
            return "outline";
        }
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
    
    const ordersReadyForBilling = allOrders.filter(o => o.status === 'Completed');
    const billedOrders = allOrders.filter(o => o.status === 'Billed' || o.status === 'Delivered');

    const filteredBilledOrders = billedOrders.filter(order => 
        (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (b.invoiceDate && a.invoiceDate) ? new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime() : 0);

    return (
        <>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center gap-2">
                <Receipt className="h-7 w-7" />
                <h2 className="text-3xl font-bold tracking-tight">Sales & Billing</h2>
            </div>
            <p className="text-muted-foreground">
                Generate invoices and track payments for orders.
            </p>
            <Separator />

            <Tabs defaultValue="billing" className="pt-4">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="billing">Ready for Billing</TabsTrigger>
                    <TabsTrigger value="payments">Bill History & Payments</TabsTrigger>
                </TabsList>
                <TabsContent value="billing">
                    <Card className="mt-2">
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
                                        {ordersReadyForBilling.length > 0 ? ordersReadyForBilling.map(order => (
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
                </TabsContent>
                <TabsContent value="payments">
                     <Card className="mt-2">
                        <CardHeader>
                            <CardTitle>Bill History</CardTitle>
                            <CardDescription>
                                Search and reprint past bills, and track payments for all invoiced orders.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center py-4">
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by Invoice #, Customer..."
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
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                            <TableHead className="text-right">Amount Paid</TableHead>
                                            <TableHead className="text-right">Balance Due</TableHead>
                                            <TableHead>Payment Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBilledOrders.length > 0 ? filteredBilledOrders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                                                <TableCell>{order.customer}</TableCell>
                                                <TableCell className="text-right">₹{order.totalAmount?.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">₹{order.paidAmount?.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-semibold">₹{order.balanceDue?.toFixed(2)}</TableCell>
                                                <TableCell><Badge variant={getPaymentStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => { setInvoiceOrder(order); setIsReprintView(true); }} variant="outline" className="mr-2">View / Reprint</Button>
                                                    {order.paymentStatus !== 'Paid' && (
                                                        <Button size="sm" onClick={() => setPaymentOrder(order)}>Record Payment</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">No billed orders found.</TableCell>
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

        <Dialog open={!!invoiceOrder} onOpenChange={(isOpen) => { if (!isOpen) { setInvoiceOrder(null); setIsReprintView(false); }}}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader className="no-print">
                    <DialogTitle>{isReprintView ? `Invoice: ${invoiceOrder?.invoiceNumber}` : 'Invoice Generated'}</DialogTitle>
                    <DialogDescription>{isReprintView ? 'View or reprint the invoice for this order.' : "You can view or print the invoice. It is now available in the 'Bill History' tab."}</DialogDescription>
                </DialogHeader>
                <div id="printable-area" className="flex-grow overflow-y-auto bg-gray-100 print:bg-white p-4 print:p-0">
                    {invoiceOrder && <Invoice order={invoiceOrder} />}
                </div>
                <DialogFooter className="no-print">
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Invoice</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={!!paymentOrder} onOpenChange={(isOpen) => { if (!isOpen) setPaymentOrder(null); }}>
             <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment for {paymentOrder?.invoiceNumber}</DialogTitle>
                    <DialogDescription>
                        Balance Due: <span className="font-bold">₹{paymentOrder?.balanceDue?.toFixed(2)}</span>
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-2">
                     <div className="space-y-2">
                        <Label htmlFor="paymentAmount">Amount</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="paymentAmount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || "")}
                                placeholder="0.00"
                                className="pl-8"
                            />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                            value={paymentMethod}
                            onValueChange={(value) => setPaymentMethod(value as any)}
                        >
                            <SelectTrigger id="paymentMethod">
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                 </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleRecordPayment}>Record Payment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
