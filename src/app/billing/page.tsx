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
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { Receipt, ShieldAlert, Trash2, Printer, Search, IndianRupee } from "lucide-react";
import type { Order, LineItem, PaymentStatus, LedgerEntry, Company } from "@/lib/types";
import { Invoice } from "@/components/invoice";
import { useCompany } from "@/contexts/company-context";


export default function BillingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { activeCompany } = useCompany();
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [totalGstRate, setTotalGstRate] = useState(18);
    const [reference, setReference] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [isReprintView, setIsReprintView] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    useEffect(() => {
        const role = localStorage.getItem("userRole");
        if (role === "owner" || role === "administrator") {
          setHasAccess(true);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!activeCompany) {
            setAllOrders([]);
            return;
        };
        
        const companyId = activeCompany.id;
        const ordersJson = localStorage.getItem(`orders_${companyId}`);
        const allCompanyOrders: Order[] = ordersJson ? JSON.parse(ordersJson) : [];
        setAllOrders(allCompanyOrders);

    }, [activeCompany]);

    const handleSelectOrder = (order: Order) => {
        if (order.type === 'Dealer' && order.details) {
            const items = order.details.split('\n').map((line, index) => {
                const match = line.match(/(\d+)x\s(.*?)\s\(SKU: (.*?)\)/);
                if (match) {
                    const quantity = parseInt(match[1], 10);
                    const name = match[2];
                    const sku = match[3];
                    return { id: `line-${index}`, description: `${name} (${sku})`, quantity, price: 0, hsn: '' };
                }
                return null;
            }).filter((item): item is LineItem => item !== null);
            setLineItems(items);
        } else { // Customized order or no details
            setLineItems([{ id: `line-0`, description: order.item, quantity: 1, price: 0, hsn: '' }]);
        }
        setSelectedOrder(order);
        setIsCreating(true);
    };

    const handleCancelCreation = () => {
        setIsCreating(false);
        setSelectedOrder(null);
        setLineItems([]);
        setReference("");
    };


    const handleLineItemChange = (id: string, field: 'description' | 'quantity' | 'price' | 'hsn', value: string) => {
        setLineItems(currentItems => currentItems.map(item => {
            if (item.id === id) {
                const newValue = (field === 'quantity' || field === 'price') ? parseFloat(value) || 0 : value;
                return { ...item, [field]: newValue };
            }
            return item;
        }));
    };

    const addLineItem = () => {
        setLineItems(current => [...current, {id: `line-${Date.now()}`, description: '', quantity: 1, price: 0, hsn: ''}]);
    };

    const removeLineItem = (id: string) => {
        setLineItems(current => current.filter(item => item.id !== id));
    };

    const { subTotal, sgstAmount, cgstAmount, totalGstAmount, totalAmount } = useMemo(() => {
        const subTotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        const totalGstAmount = subTotal * (totalGstRate / 100);
        const sgstAmount = totalGstAmount / 2;
        const cgstAmount = totalGstAmount / 2;
        const totalAmount = subTotal + totalGstAmount;
        return { subTotal, sgstAmount, cgstAmount, totalGstAmount, totalAmount };
    }, [lineItems, totalGstRate]);

    const handleGenerateInvoice = async () => {
        if (!selectedOrder || !selectedOrder.customerInfo || !activeCompany) return;
        
        const invoiceDate = new Date().toISOString();
        const invoiceNumber = `INV-${new Date().getTime()}`;

        const updatedOrderData: Partial<Order> = {
            status: "Billed",
            lineItems,
            subTotal,
            totalGstRate,
            sgstAmount,
            cgstAmount,
            totalGstAmount,
            totalAmount,
            invoiceNumber,
            invoiceDate,
            payments: [],
            paidAmount: 0,
            balanceDue: totalAmount,
            paymentStatus: totalAmount > 0 ? "Unpaid" : "Paid",
            reference: reference || undefined,
            irn: `IRN-MOCK-${new Date().getTime()}`,
            qrCodeUrl: 'https://placehold.co/100x100.png',
        };

        try {
            // Update order in localStorage
            const allCompanyOrdersJson = localStorage.getItem(`orders_${activeCompany.id}`);
            let allCompanyOrders: Order[] = allCompanyOrdersJson ? JSON.parse(allCompanyOrdersJson) : [];
            const updatedAllCompanyOrders = allCompanyOrders.map(o => o.id === selectedOrder.id ? { ...o, ...updatedOrderData } : o);
            localStorage.setItem(`orders_${activeCompany.id}`, JSON.stringify(updatedAllCompanyOrders));
            
            // This is a direct state update, so the page reflects the change immediately.
            setAllOrders(allOrders.map(o => o.id === selectedOrder.id ? { ...o, ...updatedOrderData } as Order : o));

            // Add ledger entries
            const ledgerEntriesJson = localStorage.getItem(`ledger_entries_${activeCompany.id}`);
            let ledgerEntries: LedgerEntry[] = ledgerEntriesJson ? JSON.parse(ledgerEntriesJson) : [];

            const customerDebitEntry: LedgerEntry = {
                id: `le-${Date.now()}-1`,
                date: invoiceDate,
                accountId: selectedOrder.customerInfo.id,
                accountName: selectedOrder.customerInfo.name,
                type: 'Sales',
                details: `Invoice ${invoiceNumber}${reference ? ` (Ref: ${reference})` : ''}`,
                debit: totalAmount,
                credit: 0,
                refId: selectedOrder.id,
            };
            const salesCreditEntry: LedgerEntry = {
                id: `le-${Date.now()}-2`,
                date: invoiceDate,
                accountId: 'SALES_ACCOUNT',
                accountName: 'Sales Account',
                type: 'Sales',
                details: `Against Inv ${invoiceNumber} to ${selectedOrder.customerInfo.name}${reference ? ` (Ref: ${reference})` : ''}`,
                debit: 0,
                credit: totalAmount,
                refId: selectedOrder.id,
            };
            
            ledgerEntries.push(customerDebitEntry, salesCreditEntry);
            localStorage.setItem(`ledger_entries_${activeCompany.id}`, JSON.stringify(ledgerEntries));
            
            setInvoiceOrder({ ...selectedOrder, ...updatedOrderData } as Order);
            setIsReprintView(false);
            handleCancelCreation();
            toast({ title: "Invoice Generated", description: `Order ${selectedOrder.id} is now billed.` });

        } catch(error: any) {
             toast({ variant: 'destructive', title: 'Failed to generate invoice', description: error.message });
        }
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
    
    if (!activeCompany) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle>No Company Selected</CardTitle>
                </CardHeader>
                <CardContent><p>Please select or create a company to manage billing.</p></CardContent>
                <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
              </Card>
            </div>
        );
    }
    
    const ordersReadyForBilling = allOrders.filter(o => o.status === 'Completed');
    const billedOrders = allOrders.filter(o => o.status === 'Billed' || o.status === 'Delivered');

    const filteredBilledOrders = billedOrders.filter(order => 
        (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer && order.customer.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => ((b.invoiceDate || '') > (a.invoiceDate || '')) ? 1 : -1);

    return (
        <>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 print:bg-white">
            {isCreating && selectedOrder ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Invoice for Order: {selectedOrder.id}</CardTitle>
                        <CardDescription>Customer: {selectedOrder.customer}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item Description</TableHead>
                                        <TableHead className="w-[120px]">HSN/SAC</TableHead>
                                        <TableHead className="w-[100px]">Quantity</TableHead>
                                        <TableHead className="w-[120px]">Rate</TableHead>
                                        <TableHead className="w-[140px] text-right">Amount</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lineItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Input
                                                    value={item.description}
                                                    readOnly={selectedOrder.type !== 'Customized'}
                                                    onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                                                    className={selectedOrder.type !== 'Customized' ? 'bg-gray-100' : ''}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input placeholder="HSN" value={item.hsn || ''} onChange={e => handleLineItemChange(item.id, 'hsn', e.target.value)} />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={item.quantity} onChange={e => handleLineItemChange(item.id, 'quantity', e.target.value)} min="1" className="text-right" placeholder="0" />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={item.price} onChange={e => handleLineItemChange(item.id, 'price', e.target.value)} min="0" className="text-right" placeholder="0.00" />
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                ₹{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                {selectedOrder.type === 'Customized' &&
                                                    <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)} className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {selectedOrder.type === 'Customized' && <Button variant="outline" size="sm" onClick={addLineItem}>Add Item</Button>}
                        
                        <Separator />

                        <div className="flex justify-between items-start gap-6">
                             <div className="flex-grow space-y-2">
                                <Label htmlFor="reference">Narration / Reference</Label>
                                <Textarea id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. PO-123" rows={3}/>
                            </div>
                            <div className="w-full max-w-sm space-y-2 shrink-0">
                                <CardTitle className="text-lg">Summary</CardTitle>
                                 <div className="flex items-center justify-between gap-4">
                                    <Label htmlFor="totalGstRate" className="whitespace-nowrap">Total GST Rate (%)</Label>
                                    <Input id="totalGstRate" type="number" value={totalGstRate} onChange={e => setTotalGstRate(parseFloat(e.target.value) || 0)} className="w-24 h-9"/>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-mono">₹{subTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">SGST ({(totalGstRate / 2).toFixed(2)}%)</span>
                                    <span className="font-mono">₹{sgstAmount.toFixed(2)}</span>
                                </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">CGST ({(totalGstRate / 2).toFixed(2)}%)</span>
                                    <span className="font-mono">₹{cgstAmount.toFixed(2)}</span>
                                </div>
                                <Separator className="my-1"/>
                                <div className="flex justify-between items-center font-bold text-base">
                                    <span>Total Amount</span>
                                    <span className="font-mono">₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="outline" onClick={handleCancelCreation}>Cancel</Button>
                        <Button onClick={handleGenerateInvoice} disabled={!totalAmount}>Generate Invoice</Button>
                    </CardFooter>
                </Card>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <Receipt className="h-7 w-7" />
                        <h2 className="text-3xl font-bold tracking-tight">Sales &amp; Billing</h2>
                    </div>
                    <p className="text-muted-foreground">
                        Generate invoices for completed orders.
                    </p>
                    <Separator />

                    <Tabs defaultValue="billing" className="pt-4">
                        <TabsList>
                           <TabsTrigger value="billing">Ready for Billing</TabsTrigger>
                           <TabsTrigger value="payments">Bill History</TabsTrigger>
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
                                        Search and reprint past bills. Payments are recorded on the Vouchers page.
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
                </>
            )}
        </div>

        <Dialog open={!!invoiceOrder} onOpenChange={(isOpen) => { if (!isOpen) { setInvoiceOrder(null); setIsReprintView(false); }}}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isReprintView ? `Invoice: ${invoiceOrder?.invoiceNumber}` : 'Invoice Generated'}</DialogTitle>
                    <DialogDescription>{isReprintView ? 'View or reprint the invoice for this order.' : "You can view or print the invoice. It is now available in the 'Bill History' tab."}</DialogDescription>
                </DialogHeader>
                <div id="printable-area" className="flex-grow overflow-y-auto bg-gray-100 print:bg-white p-4">
                    {invoiceOrder && <Invoice order={invoiceOrder} company={activeCompany} />}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Invoice</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        </>
    );
}
