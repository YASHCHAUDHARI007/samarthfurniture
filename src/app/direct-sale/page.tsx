
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { ShoppingBag, IndianRupee, Printer } from "lucide-react";
import type { Contact, StockItem, Order, LedgerEntry, LineItem, PaymentStatus, StockStatus } from "@/lib/types";

type SaleItem = {
  id: string; // StockItem ID
  sku: string;
  name: string;
  quantity: number | "";
  price: number | "";
  available: number;
};

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
                    <span>Invoice Total</span>
                    <span>₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
            </div>
       </div>
    </div>
);

export default function DirectSalePage() {
  const { toast } = useToast();
  const [allCustomers, setAllCustomers] = useState<Contact[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  
  const [customerSuggestions, setCustomerSuggestions] = useState<Contact[]>([]);
  
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [gstRate, setGstRate] = useState(18);

  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    setAllCustomers(storedContacts.filter(c => c.type === 'Customer' || c.type === 'Dealer'));
    
    const storedStock: StockItem[] = JSON.parse(localStorage.getItem('samarth_furniture_stock_items') || '[]');
    setStockItems(storedStock);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);

    if (value.length > 1) {
      const filtered = allCustomers.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
      setCustomerSuggestions(filtered);
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handleSelectCustomer = (customer: Contact) => {
    setCustomerName(customer.name);
    setCustomerEmail(customer.email || "");
    setShippingAddress(customer.address || "");
    setSelectedCustomerId(customer.id);
    setCustomerSuggestions([]);
  };
  
  const handleCheckboxChange = (stockItem: StockItem, checked: boolean | "indeterminate") => {
    if (checked) {
      if (stockItem.quantity > 0) {
          setSaleItems(current => [...current, { id: stockItem.id, sku: stockItem.sku, name: stockItem.name, quantity: 1, price: '', available: stockItem.quantity }]);
      } else {
          toast({ variant: "destructive", title: "Out of Stock", description: `${stockItem.name} is not available.`});
      }
    } else {
      setSaleItems(current => current.filter((item) => item.id !== stockItem.id));
    }
  };
  
  const isItemSelected = (itemId: string) => saleItems.some(item => item.id === itemId);

  const handleSaleItemChange = (itemId: string, field: 'quantity' | 'price', value: string) => {
    setSaleItems(currentItems => currentItems.map(item => {
        if (item.id === itemId) {
            const numValue = parseFloat(value) || "";
            if (field === 'quantity' && typeof numValue === 'number' && numValue > item.available) {
                toast({ variant: "destructive", title: "Stock Limit Exceeded", description: `Only ${item.available} units of ${item.name} are available.` });
                return { ...item, quantity: item.available };
            }
            return { ...item, [field]: numValue };
        }
        return item;
    }));
  };
  
  const { subTotal, gstAmount, totalAmount } = useMemo(() => {
    const sub = saleItems.reduce((acc, item) => {
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        const price = typeof item.price === 'number' ? item.price : 0;
        return acc + quantity * price;
    }, 0);
    const gst = sub * (gstRate / 100);
    const total = sub + gst;
    return { subTotal: sub, gstAmount: gst, totalAmount: total };
  }, [saleItems, gstRate]);


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !shippingAddress) {
        toast({ variant: "destructive", title: "Missing Customer", description: "Please select or enter customer details."});
        return;
    }
    const validSaleItems = saleItems.filter(item => (item.quantity || 0) > 0 && (item.price || 0) > 0);
    if (validSaleItems.length === 0) {
        toast({ variant: "destructive", title: "Invalid Items", description: "Please add items with valid quantity and price."});
        return;
    }

    // --- Save or update customer contact ---
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    let customer = storedContacts.find(c => c.name.toLowerCase() === customerName.toLowerCase() && (c.type === 'Customer' || c.type === 'Dealer'));
    let customerId = selectedCustomerId;
    
    if (!customer) {
        customerId = `CUST-${Date.now()}`;
        customer = {
            id: customerId,
            name: customerName,
            type: 'Customer',
            email: customerEmail,
            address: shippingAddress,
        };
        storedContacts.push(customer);
    } else {
        customerId = customer.id;
        // Update if different
        customer.email = customerEmail;
        customer.address = shippingAddress;
    }
    localStorage.setItem('samarth_furniture_contacts', JSON.stringify(storedContacts));
    setAllCustomers(storedContacts.filter(c => c.type === 'Customer' || c.type === 'Dealer'));
    
    // --- Create Order and Invoice ---
    const invoiceDate = new Date().toISOString();
    const invoiceNumber = `INV-${new Date().getTime()}`;
    const orderId = `ORD-${new Date().getTime()}`;
    
    const lineItems: LineItem[] = validSaleItems.map(item => ({
        id: item.id,
        description: `${item.name} (${item.sku})`,
        quantity: Number(item.quantity),
        price: Number(item.price)
    }));

    const orderDetails = lineItems.map(item => `${item.quantity}x ${item.description}`).join('\n');

    const newOrder: Order = {
        id: orderId,
        customer: customerName,
        item: "Direct Stock Sale",
        status: "Billed", // Directly billed
        type: "Dealer", // Treat as a dealer/stock order
        details: orderDetails,
        createdBy: localStorage.getItem("loggedInUser") || undefined,
        createdAt: invoiceDate,
        customerInfo: {
            id: customerId,
            name: customerName,
            email: customerEmail,
            address: shippingAddress,
        },
        invoiceNumber,
        invoiceDate,
        lineItems,
        subTotal,
        gstRate,
        gstAmount,
        totalAmount,
        payments: [],
        paidAmount: 0,
        balanceDue: totalAmount,
        paymentStatus: totalAmount > 0 ? "Unpaid" : "Paid",
        stockDeducted: true, // Stock is deducted immediately
    };
    
    // --- Update Stock Levels ---
    const currentStock: StockItem[] = JSON.parse(localStorage.getItem('samarth_furniture_stock_items') || '[]');
    const getStatus = (quantity: number, reorderLevel: number): StockStatus => {
        if (quantity <= 0) return "Out of Stock";
        if (quantity > 0 && quantity <= reorderLevel) return "Low Stock";
        return "In Stock";
    };
    const updatedStock = currentStock.map(stockItem => {
        const soldItem = validSaleItems.find(si => si.id === stockItem.id);
        if (soldItem) {
            const newQuantity = stockItem.quantity - Number(soldItem.quantity);
            return {
                ...stockItem,
                quantity: newQuantity,
                status: getStatus(newQuantity, stockItem.reorderLevel)
            };
        }
        return stockItem;
    });
    localStorage.setItem('samarth_furniture_stock_items', JSON.stringify(updatedStock));
    setStockItems(updatedStock);


    // --- Create Ledger Entries ---
    const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem('samarth_furniture_ledger') || '[]');
    const customerDebitEntry: LedgerEntry = {
        id: `LEDG-${Date.now()}-D`,
        date: invoiceDate,
        accountId: customerId,
        accountName: customerName,
        type: 'Sales',
        details: `Invoice ${invoiceNumber}`,
        debit: totalAmount,
        credit: 0,
        refId: orderId,
    };
    const salesCreditEntry: LedgerEntry = {
        id: `LEDG-${Date.now()}-C`,
        date: invoiceDate,
        accountId: 'SALES_ACCOUNT',
        accountName: 'Sales Account',
        type: 'Sales',
        details: `Against Inv ${invoiceNumber} to ${customerName}`,
        debit: 0,
        credit: totalAmount,
        refId: orderId,
    };
    ledgerEntries.push(customerDebitEntry, salesCreditEntry);
    localStorage.setItem('samarth_furniture_ledger', JSON.stringify(ledgerEntries));


    // --- Save Order ---
    const allOrders: Order[] = JSON.parse(localStorage.getItem('samarth_furniture_orders') || '[]');
    localStorage.setItem('samarth_furniture_orders', JSON.stringify([...allOrders, newOrder]));
    
    // --- Finalize ---
    setInvoiceOrder(newOrder); // Show invoice dialog
    toast({ title: "Sale Recorded!", description: `Invoice ${invoiceNumber} created. Order is ready for dispatch.` });
    
    // Reset form
    setCustomerName("");
    setCustomerEmail("");
    setShippingAddress("");
    setSelectedCustomerId(null);
    setSaleItems([]);
  };

  const handlePrint = () => window.print();

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Direct Sale</h2>
      </div>
      <p className="text-muted-foreground">
        Create an invoice for items sold directly from existing stock.
      </p>
      <Separator />
      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-5 gap-8 mt-6">
            <div className="lg:col-span-3 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Products</CardTitle>
                        <CardDescription>Select products from stock to sell.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Available</TableHead>
                                        <TableHead>Sell Qty</TableHead>
                                        <TableHead>Price/Unit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {stockItems.length > 0 ? stockItems.map((item) => (
                                    <TableRow key={item.id} className={item.quantity <= 0 ? "text-muted-foreground" : ""}>
                                        <TableCell>
                                            <Checkbox
                                                id={`select-${item.id}`}
                                                onCheckedChange={(checked) => handleCheckboxChange(item, checked)}
                                                checked={isItemSelected(item.id)}
                                                disabled={item.quantity <= 0}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div>{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                                        </TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="1"
                                                max={item.quantity}
                                                value={saleItems.find(si => si.id === item.id)?.quantity || ''}
                                                onChange={(e) => handleSaleItemChange(item.id, 'quantity', e.target.value)}
                                                disabled={!isItemSelected(item.id)}
                                                className="w-20 h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="0.00"
                                                value={saleItems.find(si => si.id === item.id)?.price || ''}
                                                onChange={(e) => handleSaleItemChange(item.id, 'price', e.target.value)}
                                                disabled={!isItemSelected(item.id)}
                                                className="w-24 h-8"
                                            />
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No finished goods in stock.</TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">Customer Name</Label>
                            <div className="relative">
                                <Input 
                                    id="name" 
                                    name="name" 
                                    placeholder="e.g. Jane Doe" 
                                    required 
                                    value={customerName} 
                                    onChange={handleNameChange} 
                                    onBlur={() => setTimeout(() => setCustomerSuggestions([]), 150)}
                                    autoComplete="off"
                                />
                                {customerSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                                        <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                            {customerSuggestions.map(c => ( 
                                                <Button 
                                                    key={c.id} 
                                                    type="button"
                                                    variant="ghost" 
                                                    className="justify-start" 
                                                    onClick={() => handleSelectCustomer(c)}>
                                                        {c.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">Customer Email</Label>
                            <Input id="email" name="email" type="email" placeholder="e.g. jane.doe@example.com" required value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Shipping Address</Label>
                            <Input id="address" name="address" placeholder="e.g. 123 Main St" required value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Invoice Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="gstRate">GST Rate (%)</Label>
                            <Input id="gstRate" type="number" value={gstRate} onChange={e => setGstRate(parseFloat(e.target.value) || 0)} className="w-24"/>
                        </div>
                        <Separator/>
                        <div className="flex justify-between">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-mono">{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">GST ({gstRate}%)</span>
                            <span className="font-mono">{gstAmount.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount</span>
                            <div className="flex items-center font-mono">
                                <IndianRupee className="h-5 w-5 mr-1" />
                                <span>{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={saleItems.length === 0 || totalAmount <= 0}>Generate Invoice & Save</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </form>
    </div>

    <Dialog open={!!invoiceOrder} onOpenChange={(isOpen) => !isOpen && setInvoiceOrder(null)}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Invoice Generated</DialogTitle>
                <DialogDescription>The order is now ready for dispatch. You can print the invoice below.</DialogDescription>
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
