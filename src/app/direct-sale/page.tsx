"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
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
import { ShoppingBag, IndianRupee, Printer, CalendarIcon, Trash2, ShieldAlert } from "lucide-react";
import type { Ledger, StockItem, Order, LedgerEntry, LineItem, PaymentStatus, StockStatus, Company } from "@/lib/types";
import { Invoice } from "@/components/invoice";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [allDebtors, setAllDebtors] = useState<Ledger[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  
  const [customerSuggestions, setCustomerSuggestions] = useState<Ledger[]>([]);
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
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "owner" || role === "factory" || role === "administrator") {
        setHasAccess(true);
    }
    setIsLoading(false);

    const companyId = localStorage.getItem('activeCompanyId');
    if(companyId){
        const companiesJson = localStorage.getItem('companies');
        const companies: Company[] = companiesJson ? JSON.parse(companiesJson) : [];
        const company = companies.find(c => c.id === companyId);
        setActiveCompany(company || null);
    }
  }, []);

  useEffect(() => {
    if (!activeCompany?.id) {
      setAllDebtors([]);
      setStockItems([]);
      return;
    };
    
    const companyId = activeCompany.id;
    const ledgersJson = localStorage.getItem(`ledgers_${companyId}`);
    const ledgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
    setAllDebtors(ledgers.filter(c => c.group === 'Sundry Debtors'));
    
    const stockItemsJson = localStorage.getItem(`stock_items_${companyId}`);
    setStockItems(stockItemsJson ? JSON.parse(stockItemsJson) : []);

    addSaleItem();

  }, [activeCompany]);


  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);

    if (value.length > 1) {
      const filtered = allDebtors.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
      setCustomerSuggestions(filtered);
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handleSelectCustomer = (customer: Ledger) => {
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


  const handleSubmit = async () => {
    if (!activeCompany?.id) {
        toast({ variant: "destructive", title: "No Active Company", description: "Please select a company before creating a sale." });
        return;
    }
    if (!customerName || !shippingAddress) {
        toast({ variant: "destructive", title: "Missing Customer", description: "Please select or enter customer details."});
        return;
    }
    const validSaleItems = saleItems.filter(item => (item.quantity || 0) > 0 && (item.price || 0) >= 0 && item.stockItemId);
    if (validSaleItems.length === 0) {
        toast({ variant: "destructive", title: "Invalid Items", description: "Please add items with valid quantity and price."});
        return;
    }
    if (!saleDate) {
        toast({ variant: "destructive", title: "Missing Date", description: "Please select a sale date."});
        return;
    }
    
    try {
        const ledgersJson = localStorage.getItem(`ledgers_${activeCompany.id}`);
        let ledgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
        let customer = ledgers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        let customerId = selectedCustomerId;
        
        if (!customer) {
            customerId = `LEDG-${Date.now()}`;
            const newLedger: Ledger = { id: customerId, name: customerName, group: 'Sundry Debtors', address: shippingAddress, email: '' };
            ledgers.push(newLedger);
        } else {
            customerId = customer.id;
            customer.address = shippingAddress;
            ledgers = ledgers.map(l => l.id === customerId ? customer! : l);
        }
        localStorage.setItem(`ledgers_${activeCompany.id}`, JSON.stringify(ledgers));
        
        const invoiceDate = saleDate.toISOString();
        const invoiceNumber = `INV-${new Date().getTime()}`;
        
        const lineItems: LineItem[] = validSaleItems.map(item => ({
            id: item.stockItemId,
            description: `${item.name} (${item.sku})`,
            quantity: Number(item.quantity),
            price: Number(item.price),
            hsn: item.hsn,
        }));

        const orderDetails = lineItems.map(item => `${item.quantity}x ${item.description}`).join('\n');
        
        const allOrdersJson = localStorage.getItem(`orders_${activeCompany.id}`);
        const allOrders: Order[] = allOrdersJson ? JSON.parse(allOrdersJson) : [];
        const orderId = `ord-${Date.now()}`;

        const newOrderData: Order = {
            id: orderId, customer: customerName, item: "Direct Stock Sale", status: "Billed", type: "Dealer", details: orderDetails, createdBy: localStorage.getItem("loggedInUser") || undefined, createdAt: invoiceDate,
            customerInfo: { id: customerId!, name: customerName, address: shippingAddress, },
            invoiceNumber, invoiceDate, lineItems, subTotal, totalGstRate: gstRate, sgstAmount, cgstAmount, totalGstAmount, totalAmount,
            payments: [], paidAmount: 0, balanceDue: totalAmount, paymentStatus: totalAmount > 0 ? "Unpaid" : "Paid", stockDeducted: true,
            irn: `IRN-MOCK-${new Date().getTime()}`,
            qrCodeUrl: 'https://placehold.co/100x100.png',
        };
        allOrders.push(newOrderData);
        localStorage.setItem(`orders_${activeCompany.id}`, JSON.stringify(allOrders));
        
        const getStatus = (quantity: number, reorderLevel: number): StockStatus => {
            if (quantity <= 0) return "Out of Stock";
            if (quantity > 0 && quantity <= reorderLevel) return "Low Stock";
            return "In Stock";
        };

        const allStockJson = localStorage.getItem(`stock_items_${activeCompany.id}`);
        let allStock: StockItem[] = allStockJson ? JSON.parse(allStockJson) : [];

        validSaleItems.forEach(item => {
            allStock = allStock.map(si => {
                if (si.id === item.stockItemId) {
                    const newQuantity = si.quantity - Number(item.quantity);
                    return { ...si, quantity: newQuantity, status: getStatus(newQuantity, si.reorderLevel) };
                }
                return si;
            });
        });
        localStorage.setItem(`stock_items_${activeCompany.id}`, JSON.stringify(allStock));
        setStockItems(allStock);

        const ledgerEntriesJson = localStorage.getItem(`ledger_entries_${activeCompany.id}`);
        const ledgerEntries: LedgerEntry[] = ledgerEntriesJson ? JSON.parse(ledgerEntriesJson) : [];

        const customerDebitEntry: LedgerEntry = { id: `le-${Date.now()}-1`, date: invoiceDate, accountId: customerId!, accountName: customerName, type: 'Sales', details: `Invoice ${invoiceNumber}`, debit: totalAmount, credit: 0, refId: orderId };
        const salesCreditEntry: LedgerEntry = { id: `le-${Date.now()}-2`, date: invoiceDate, accountId: 'SALES_ACCOUNT', accountName: 'Sales Account', type: 'Sales', details: `Against Inv ${invoiceNumber} to ${customerName}`, debit: 0, credit: totalAmount, refId: orderId };
        ledgerEntries.push(customerDebitEntry, salesCreditEntry);
        localStorage.setItem(`ledger_entries_${activeCompany.id}`, JSON.stringify(ledgerEntries));
        
        setInvoiceOrder(newOrderData);
        toast({ title: "Sale Recorded!", description: `Invoice ${invoiceNumber} created.` });
        
        setCustomerName("");
        setShippingAddress("");
        setSelectedCustomerId(null);
        setSaleItems([{ key: `item-${Date.now()}`, stockItemId: '', sku: '', name: '', hsn: '', quantity: '', price: '', available: 0 }]);
        setSaleDate(new Date());
        setNarration("");
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Failed to record sale', description: error.message });
    }
  };

  const handlePrint = () => window.print();
  const totalQuantity = useMemo(() => saleItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0), [saleItems]);
  
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
            <CardContent><p>Please select or create a company to manage sales.</p></CardContent>
            <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
          </Card>
        </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
            <ShoppingBag className="h-7 w-7" />
            <h2 className="text-3xl font-bold tracking-tight">Direct Stock Sale</h2>
        </div>
        <p className="text-muted-foreground">
          Sell items directly from your finished goods inventory.
        </p>
        <Separator />
        
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Create Sale</CardTitle>
                <CardDescription>Fill in customer and item details to generate an invoice instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="name">Customer Name</Label>
                        <div className="relative">
                            <Input id="name" name="name" required value={customerName} onChange={handleNameChange} onBlur={() => setTimeout(() => setCustomerSuggestions([]), 150)} autoComplete="off" />
                            {customerSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                                    <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                        {customerSuggestions.map(c => ( <button key={c.id} type="button" className="w-full text-left p-2 rounded-md hover:bg-muted" onClick={() => handleSelectCustomer(c)}>{c.name}</button>))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="saleDate">Sale Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !saleDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={saleDate} onSelect={setSaleDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Shipping Address</Label>
                    <Textarea id="address" name="address" required value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} rows={2} />
                </div>
            
                <div className="space-y-2">
                    <Label>Sale Items</Label>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Item</TableHead>
                                    <TableHead>HSN/SAC</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {saleItems.map((item, index) => (
                                    <TableRow key={item.key}>
                                        <TableCell>
                                            <div className="relative">
                                                <Input
                                                    placeholder="Type to search item"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(item.key, 'name', e.target.value)}
                                                    onFocus={() => setActiveItemInput(item.key)}
                                                    onBlur={() => setTimeout(() => { setActiveItemInput(null); setItemSuggestions([]); }, 150)}
                                                    autoComplete="off"
                                                    required
                                                />
                                                {activeItemInput === item.key && itemSuggestions.length > 0 && (
                                                    <div className="absolute z-20 w-full mt-1 bg-card border rounded-md shadow-lg">
                                                        <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                                            {itemSuggestions.map(s => (
                                                                <div key={s.id} className="p-2 hover:bg-muted rounded-md cursor-pointer" onMouseDown={() => {handleItemChange(item.key, 'stockItemId', s.id); setItemSuggestions([]);}}>
                                                                    {s.name} (Available: {s.quantity})
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell><Input placeholder="HSN" value={item.hsn} onChange={e => handleItemChange(item.key, 'hsn', e.target.value)} /></TableCell>
                                        <TableCell><Input type="number" value={item.quantity} onChange={e => handleItemChange(item.key, 'quantity', parseFloat(e.target.value) || "")} min="1" max={item.available || undefined} className="text-right" placeholder="0" /></TableCell>
                                        <TableCell><Input type="number" value={item.price} onChange={e => handleItemChange(item.key, 'price', parseFloat(e.target.value) || "")} min="0" className="text-right" placeholder="0.00" /></TableCell>
                                        <TableCell className="text-right font-mono">₹{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}</TableCell>
                                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeSaleItem(item.key)} className="text-destructive"><Trash2 className="h-4 w-4"/></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     <Button variant="outline" size="sm" onClick={addSaleItem} className="mt-2">Add Row</Button>
                </div>
            
                <Separator />

                <div className="flex items-start justify-between gap-4 pt-4">
                    <div className="flex-grow space-y-2">
                        <Label htmlFor="narration">Narration</Label>
                        <Textarea id="narration" value={narration} onChange={e => setNarration(e.target.value)} rows={4} className="w-full max-w-md"/>
                    </div>
                    <div className="w-full max-w-sm space-y-2">
                        <CardTitle className="text-lg">Summary</CardTitle>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Quantity</span>
                            <span className="font-mono">{totalQuantity.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-mono">₹{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <Label htmlFor="gstRate" className="whitespace-nowrap text-muted-foreground">GST Rate (%)</Label>
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
                        <Separator className="my-1"/>
                        <div className="flex justify-between items-center font-bold text-base">
                            <span>Total Amount</span>
                            <span className="font-mono">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="justify-end">
                <Button onClick={handleSubmit} disabled={saleItems.length === 0 || totalAmount <= 0}>Create Sale & Invoice</Button>
            </CardFooter>
        </Card>
      </div>

      <Dialog open={!!invoiceOrder} onOpenChange={(isOpen) => !isOpen && setInvoiceOrder(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                  <DialogTitle>Invoice Generated</DialogTitle>
                  <DialogDescription>The order is now ready for dispatch. You can print the invoice below.</DialogDescription>
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
