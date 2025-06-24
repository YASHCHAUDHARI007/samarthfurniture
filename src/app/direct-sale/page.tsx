
"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, IndianRupee, Printer, CalendarIcon, Trash2 } from "lucide-react";
import type { Contact, StockItem, Order, LedgerEntry, LineItem, PaymentStatus, StockStatus } from "@/lib/types";
import { Invoice } from "@/components/invoice";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type SaleItem = {
  key: string;
  stockItemId: string;
  sku: string;
  name: string;
  hsn: string;
  quantity: number | "";
  price: number | "";
  available: number;
};

export default function DirectSalePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [allCustomers, setAllCustomers] = useState<Contact[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  
  const [customerSuggestions, setCustomerSuggestions] = useState<Contact[]>([]);
  const [itemSuggestions, setItemSuggestions] = useState<StockItem[]>([]);
  
  const [customerName, setCustomerName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [gstRate, setGstRate] = useState(18);
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
  const [narration, setNarration] = useState("");

  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [activeItemInput, setActiveItemInput] = useState<string | null>(null);
  const [voucherNumber, setVoucherNumber] = useState("");
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);


  const getCompanyStorageKey = (baseKey: string) => {
      if (!activeCompanyId) return null;
      return `samarth_furniture_${activeCompanyId}_${baseKey}`;
  };

  useEffect(() => {
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
    setVoucherNumber(new Date().getTime().toString().slice(-5));
  }, []);

  useEffect(() => {
    if (!activeCompanyId) {
      setAllCustomers([]);
      setStockItems([]);
      return;
    };
    
    const contactsKey = getCompanyStorageKey('contacts')!;
    const stockKey = getCompanyStorageKey('stock_items')!;
    
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem(contactsKey) || '[]');
    setAllCustomers(storedContacts.filter(c => c.type === 'Customer' || c.type === 'Dealer'));
    
    const storedStock: StockItem[] = JSON.parse(localStorage.getItem(stockKey) || '[]');
    setStockItems(storedStock);
    addSaleItem();

  }, [activeCompanyId]);


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
    setShippingAddress(customer.address || "");
    setSelectedCustomerId(customer.id);
    setCustomerSuggestions([]);
  };

  const addSaleItem = () => {
    setSaleItems(current => [...current, { key: `item-${Date.now()}`, stockItemId: '', sku: '', name: '', hsn: '', quantity: '', price: '', available: 0 }]);
  };
  
  const removeSaleItem = (key: string) => {
    setSaleItems(current => current.filter(item => item.key !== key));
  };
  
  const handleItemChange = (key: string, field: keyof SaleItem, value: any) => {
    setSaleItems(current => current.map(item => {
        if (item.key === key) {
            const updatedItem = { ...item, [field]: value };
            
            if (field === 'name') {
              updatedItem.stockItemId = '';
              const searchVal = String(value).toLowerCase();
              if(searchVal) {
                setItemSuggestions(stockItems.filter(s => s.name.toLowerCase().includes(searchVal) && s.quantity > 0));
              } else {
                setItemSuggestions([]);
              }
            }
            
            if (field === 'stockItemId') {
                const selectedStock = stockItems.find(s => s.id === value);
                if (selectedStock) {
                    updatedItem.name = selectedStock.name;
                    updatedItem.sku = selectedStock.sku;
                    updatedItem.available = selectedStock.quantity;
                }
            }

            if (field === 'quantity' && typeof value === 'number' && updatedItem.available > 0 && value > updatedItem.available) {
                toast({ variant: "destructive", title: "Stock Limit Exceeded", description: `Only ${updatedItem.available} units of ${updatedItem.name} are available.` });
                return { ...updatedItem, quantity: updatedItem.available };
            }
            return updatedItem;
        }
        return item;
    }));
  };

  const { subTotal, sgstAmount, cgstAmount, totalGstAmount, totalAmount } = useMemo(() => {
    const sub = saleItems.reduce((acc, item) => {
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        const price = typeof item.price === 'number' ? item.price : 0;
        return acc + quantity * price;
    }, 0);
    const gst = sub * (gstRate / 100);
    const total = sub + gst;
    return { subTotal: sub, sgstAmount: gst / 2, cgstAmount: gst / 2, totalGstAmount: gst, totalAmount: total };
  }, [saleItems, gstRate]);


  const handleSubmit = () => {
    if (!activeCompanyId) {
        toast({ variant: "destructive", title: "No Active Company", description: "Please select a company before creating a sale." });
        return;
    }
    if (!customerName || !shippingAddress) {
        toast({ variant: "destructive", title: "Missing Customer", description: "Please select or enter customer details."});
        return;
    }
    const validSaleItems = saleItems.filter(item => (item.quantity || 0) > 0 && (item.price || 0) > 0 && item.stockItemId);
    if (validSaleItems.length === 0) {
        toast({ variant: "destructive", title: "Invalid Items", description: "Please add items with valid quantity and price."});
        return;
    }
    if (!saleDate) {
        toast({ variant: "destructive", title: "Missing Date", description: "Please select a sale date."});
        return;
    }
    
    const contactsKey = getCompanyStorageKey('contacts')!;
    const ordersKey = getCompanyStorageKey('orders')!;
    const stockKey = getCompanyStorageKey('stock_items')!;
    const ledgerKey = getCompanyStorageKey('ledger')!;

    const storedContacts: Contact[] = JSON.parse(localStorage.getItem(contactsKey) || '[]');
    let customer = storedContacts.find(c => c.name.toLowerCase() === customerName.toLowerCase() && (c.type === 'Customer' || c.type === 'Dealer'));
    let customerId = selectedCustomerId;
    
    if (!customer) {
        customerId = `CUST-${Date.now()}`;
        customer = { id: customerId, name: customerName, type: 'Customer', address: shippingAddress, };
        storedContacts.push(customer);
    } else {
        customerId = customer.id;
        customer.address = shippingAddress;
    }
    localStorage.setItem(contactsKey, JSON.stringify(storedContacts));
    setAllCustomers(storedContacts.filter(c => c.type === 'Customer' || c.type === 'Dealer'));
    
    const invoiceDate = saleDate.toISOString();
    const invoiceNumber = `INV-${new Date().getTime()}`;
    const orderId = `ORD-${new Date().getTime()}`;
    
    const lineItems: LineItem[] = validSaleItems.map(item => ({
        id: item.stockItemId,
        description: `${item.name} (${item.sku})`,
        quantity: Number(item.quantity),
        price: Number(item.price),
        hsn: item.hsn,
    }));

    const orderDetails = lineItems.map(item => `${item.quantity}x ${item.description}`).join('\n');

    const newOrder: Order = {
        id: orderId, customer: customerName, item: "Direct Stock Sale", status: "Billed", type: "Dealer", details: orderDetails, createdBy: localStorage.getItem("loggedInUser") || undefined, createdAt: invoiceDate,
        customerInfo: { id: customerId, name: customerName, address: shippingAddress, },
        invoiceNumber, invoiceDate, lineItems, subTotal, totalGstRate: gstRate, sgstAmount, cgstAmount, totalGstAmount, totalAmount,
        payments: [], paidAmount: 0, balanceDue: totalAmount, paymentStatus: totalAmount > 0 ? "Unpaid" : "Paid", stockDeducted: true,
        irn: `IRN-MOCK-${new Date().getTime()}`,
        qrCodeUrl: 'https://placehold.co/100x100.png',
    };
    
    const currentStock: StockItem[] = JSON.parse(localStorage.getItem(stockKey) || '[]');
    const getStatus = (quantity: number, reorderLevel: number): StockStatus => {
        if (quantity <= 0) return "Out of Stock";
        if (quantity > 0 && quantity <= reorderLevel) return "Low Stock";
        return "In Stock";
    };
    const updatedStock = currentStock.map(stockItem => {
        const soldItem = validSaleItems.find(si => si.stockItemId === stockItem.id);
        if (soldItem) {
            const newQuantity = stockItem.quantity - Number(soldItem.quantity);
            return { ...stockItem, quantity: newQuantity, status: getStatus(newQuantity, stockItem.reorderLevel) };
        }
        return stockItem;
    });
    localStorage.setItem(stockKey, JSON.stringify(updatedStock));
    setStockItems(updatedStock);

    const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem(ledgerKey) || '[]');
    ledgerEntries.push({
        id: `LEDG-${Date.now()}-D`, date: invoiceDate, accountId: customerId, accountName: customerName, type: 'Sales',
        details: `Invoice ${invoiceNumber}`, debit: totalAmount, credit: 0, refId: orderId,
    });
    ledgerEntries.push({
        id: `LEDG-${Date.now()}-C`, date: invoiceDate, accountId: 'SALES_ACCOUNT', accountName: 'Sales Account', type: 'Sales',
        details: `Against Inv ${invoiceNumber} to ${customerName}`, debit: 0, credit: totalAmount, refId: orderId,
    });
    localStorage.setItem(ledgerKey, JSON.stringify(ledgerEntries));

    const allOrders: Order[] = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    localStorage.setItem(ordersKey, JSON.stringify([...allOrders, newOrder]));
    
    setInvoiceOrder(newOrder);
    toast({ title: "Sale Recorded!", description: `Invoice ${invoiceNumber} created.` });
    
    setCustomerName("");
    setShippingAddress("");
    setSelectedCustomerId(null);
    setSaleItems([]);
    addSaleItem();
    setSaleDate(new Date());
    setNarration("");
    setVoucherNumber(new Date().getTime().toString().slice(-5));
  };

  const handlePrint = () => window.print();
  const totalQuantity = useMemo(() => saleItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0), [saleItems]);
  
  if (!activeCompanyId) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
            </CardHeader>
            <CardContent><p>Please select or create a company to manage sales.</p></CardContent>
            <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
          </Card>
        </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-blue-800">Sales</h2>
            <p className="font-mono">{voucherNumber ? `No. ${voucherNumber}` : 'No. ...'}</p>
        </div>

        <div className="mt-4">
            <div className="bg-emerald-50 border border-gray-300 p-4 rounded-md space-y-4">
                <div className="flex justify-end">
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !saleDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={saleDate} onSelect={setSaleDate} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-y-2 gap-x-4">
                    <Label htmlFor="name" className="font-semibold text-right">Party A/c name</Label>
                    <div className="relative">
                        <Input id="name" name="name" required value={customerName} onChange={handleNameChange} onBlur={() => setTimeout(() => setCustomerSuggestions([]), 150)} autoComplete="off" className="bg-white" />
                        {customerSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                                <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                    {customerSuggestions.map(c => ( <button key={c.id} type="button" className="w-full text-left p-2 rounded-md hover:bg-muted" onClick={() => handleSelectCustomer(c)}>{c.name}</button>))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Label htmlFor="address" className="font-semibold text-right">Address</Label>
                    <Input id="address" name="address" required value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className="bg-white" />
                </div>
                
                <div className="space-y-1 bg-amber-50 p-2 rounded">
                    <div className="grid grid-cols-[1fr_120px_100px_120px_140px_40px] gap-2 text-sm font-bold text-center">
                        <Label className="text-left">Name of Item</Label>
                        <Label>HSN/SAC</Label>
                        <Label>Quantity</Label>
                        <Label>Rate</Label>
                        <Label>Amount</Label>
                        <div></div>
                    </div>
                    {saleItems.map((item, index) => (
                        <div key={item.key} className="grid grid-cols-[1fr_120px_100px_120px_140px_40px] gap-2 items-start">
                             <div className="relative">
                                <Input
                                    placeholder="Type to search item"
                                    value={item.name}
                                    onChange={(e) => handleItemChange(item.key, 'name', e.target.value)}
                                    onFocus={() => setActiveItemInput(item.key)}
                                    onBlur={() => setTimeout(() => { setActiveItemInput(null); setItemSuggestions([]); }, 150)}
                                    autoComplete="off"
                                    className="bg-white h-9"
                                    required
                                />
                                {activeItemInput === item.key && itemSuggestions.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-card border rounded-md shadow-lg">
                                        <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                            {itemSuggestions.map(s => (
                                                <div key={s.id} className="p-2 hover:bg-muted rounded-md cursor-pointer" onMouseDown={() => {handleItemChange(item.key, 'stockItemId', s.id); setItemSuggestions([]);}}>
                                                    {s.name} ({s.quantity})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                             </div>
                             <Input placeholder="HSN" value={item.hsn} onChange={e => handleItemChange(item.key, 'hsn', e.target.value)} className="bg-white h-9" />
                             <Input type="number" value={item.quantity} onChange={e => handleItemChange(item.key, 'quantity', parseFloat(e.target.value) || "")} min="1" max={item.available || undefined} className="text-right bg-white h-9" placeholder="0" />
                             <Input type="number" value={item.price} onChange={e => handleItemChange(item.key, 'price', parseFloat(e.target.value) || "")} min="0" className="text-right bg-white h-9" placeholder="0.00" />
                             <Input value={((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)} className="text-right bg-gray-100 h-9" readOnly />
                             <Button variant="ghost" size="icon" onClick={() => removeSaleItem(item.key)} className="text-destructive h-9 w-9"><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    ))}
                    <Button variant="link" size="sm" onClick={addSaleItem}>Add Row</Button>
                </div>
                
                 <div className="flex items-start justify-between gap-4 pt-4">
                    {/* Narration on the left */}
                    <div className="flex-grow space-y-1">
                        <Label htmlFor="narration" className="font-semibold">Narration:</Label>
                        <Textarea 
                            id="narration" 
                            value={narration} 
                            onChange={e => setNarration(e.target.value)} 
                            rows={4} 
                            className="bg-white mt-1 w-full max-w-md"
                        />
                    </div>
                    {/* Totals on the right */}
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <p className="font-semibold">Total Qty:</p>
                            <p className="font-mono font-bold">{totalQuantity.toFixed(2)}</p>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-mono">₹{subTotal.toFixed(2)}</span>
                        </div>
                         <div className="flex items-center justify-between gap-4 text-sm">
                            <Label htmlFor="gstRate" className="whitespace-nowrap text-muted-foreground">GST Rate</Label>
                            <Input id="gstRate" type="number" value={gstRate} onChange={e => setGstRate(parseFloat(e.target.value) || 0)} className="w-24 h-8"/>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">SGST ({(gstRate / 2).toFixed(2)}%)</span>
                            <span className="font-mono">₹{sgstAmount.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">CGST ({(gstRate / 2).toFixed(2)}%)</span>
                            <span className="font-mono">₹{cgstAmount.toFixed(2)}</span>
                        </div>
                        <Separator className="my-1 bg-gray-300"/>
                        <div className="flex justify-between items-center font-bold text-base">
                            <p>Total Amt:</p>
                            <p className="font-mono">₹{totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSubmit} disabled={saleItems.length === 0 || totalAmount <= 0}>Accept</Button>
                </div>
            </div>
        </div>
      </div>

      <Dialog open={!!invoiceOrder} onOpenChange={(isOpen) => !isOpen && setInvoiceOrder(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader className="no-print">
                  <DialogTitle>Invoice Generated</DialogTitle>
                  <DialogDescription>The order is now ready for dispatch. You can print the invoice below.</DialogDescription>
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
    </>
  );
}
