
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Banknote, IndianRupee, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contact, LedgerEntry, Order, Purchase, Payment, PaymentStatus } from "@/lib/types";

export default function PaymentsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // States for Receipt Voucher
  const [receiptContactId, setReceiptContactId] = useState("");
  const [receiptAmount, setReceiptAmount] = useState<number | "">("");
  const [receiptMethod, setReceiptMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Other'>('UPI');
  const [receiptRef, setReceiptRef] = useState("");
  const [receiptDate, setReceiptDate] = useState<Date | undefined>(new Date());
  const [unpaidInvoices, setUnpaidInvoices] = useState<Order[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  // States for Payment Voucher
  const [paymentContactId, setPaymentContactId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Other'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [unpaidPurchases, setUnpaidPurchases] = useState<Purchase[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState("");

  useEffect(() => {
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    setContacts(storedContacts);
    const storedOrders: Order[] = JSON.parse(localStorage.getItem('samarth_furniture_orders') || '[]');
    setOrders(storedOrders);
    const storedPurchases: Purchase[] = JSON.parse(localStorage.getItem('samarth_furniture_purchases') || '[]');
    const initializedPurchases = storedPurchases.map(p => ({
        ...p,
        paidAmount: p.paidAmount || 0,
        balanceDue: p.balanceDue ?? p.totalAmount,
        paymentStatus: p.paymentStatus || (p.totalAmount > 0 ? 'Unpaid' : 'Paid'),
        payments: p.payments || [],
    }));
    setPurchases(initializedPurchases);
  }, []);

  useEffect(() => {
    if (receiptContactId) {
      const customerOrders = orders.filter(o => o.customerInfo?.id === receiptContactId && o.status !== 'Pending' && o.status !== 'Working');
      const dueOrders = customerOrders.filter(o => o.balanceDue && o.balanceDue > 0.01);
      setUnpaidInvoices(dueOrders);
    } else {
      setUnpaidInvoices([]);
    }
    setSelectedInvoiceId("");
    setReceiptAmount("");
  }, [receiptContactId, orders]);

  useEffect(() => {
      if (paymentContactId) {
          const supplierPurchases = purchases.filter(p => p.supplierId === paymentContactId);
          const duePurchases = supplierPurchases.filter(p => p.balanceDue && p.balanceDue > 0.01);
          setUnpaidPurchases(duePurchases);
      } else {
          setUnpaidPurchases([]);
      }
      setSelectedPurchaseId("");
      setPaymentAmount("");
  }, [paymentContactId, purchases]);

  const handleInvoiceSelect = (invoiceId: string) => {
    if (invoiceId === 'adhoc') {
        setSelectedInvoiceId("");
        setReceiptAmount("");
    } else {
        setSelectedInvoiceId(invoiceId);
        const invoice = unpaidInvoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            setReceiptAmount(invoice.balanceDue || 0);
        }
    }
  };

  const handlePurchaseSelect = (purchaseId: string) => {
    if (purchaseId === 'adhoc') {
        setSelectedPurchaseId("");
        setPaymentAmount("");
    } else {
        setSelectedPurchaseId(purchaseId);
        const purchase = unpaidPurchases.find(p => p.id === purchaseId);
        if (purchase) {
            setPaymentAmount(purchase.balanceDue || 0);
        }
    }
  };

  const handleRecordReceipt = () => {
    if (!receiptContactId || !receiptAmount || receiptAmount <= 0 || !receiptDate) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a customer, date and enter a valid amount." });
      return;
    }
    const customer = contacts.find(c => c.id === receiptContactId);
    if (!customer) return;

    const paymentDateISO = receiptDate.toISOString();
    const paymentId = `PAY-${Date.now()}`;
    const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem('samarth_furniture_ledger') || '[]');
    const allOrders: Order[] = JSON.parse(localStorage.getItem('samarth_furniture_orders') || '[]');
    
    const details = `Received via ${receiptMethod}. Ref: ${receiptRef || 'N/A'} ${selectedInvoiceId ? `against INV #${allOrders.find(o => o.id === selectedInvoiceId)?.invoiceNumber}` : ''}`.trim();
    
    ledgerEntries.push({
      id: `LEDG-${Date.now()}-C`,
      date: paymentDateISO,
      accountId: customer.id,
      accountName: customer.name,
      type: 'Receipt',
      details,
      debit: 0,
      credit: receiptAmount,
      refId: paymentId,
    });
    
    ledgerEntries.push({
      id: `LEDG-${Date.now()}-D`,
      date: paymentDateISO,
      accountId: 'CASH_BANK_ACCOUNT',
      accountName: 'Cash/Bank Account',
      type: 'Receipt',
      details: `From ${customer.name}`,
      debit: receiptAmount,
      credit: 0,
      refId: paymentId,
    });

    localStorage.setItem('samarth_furniture_ledger', JSON.stringify(ledgerEntries));

    if (selectedInvoiceId) {
        const updatedOrders = allOrders.map(order => {
            if (order.id === selectedInvoiceId) {
                const newPayment: Payment = {
                    id: paymentId, date: paymentDateISO, amount: receiptAmount as number, method: receiptMethod,
                };
                const payments = [...(order.payments || []), newPayment];
                const paidAmount = payments.reduce((acc, p) => acc + p.amount, 0);
                const balanceDue = (order.totalAmount || 0) - paidAmount;
                const paymentStatus: PaymentStatus = balanceDue <= 0.01 ? 'Paid' : 'Partially Paid';
                return { ...order, payments, paidAmount, balanceDue, paymentStatus };
            }
            return order;
        });
        localStorage.setItem('samarth_furniture_orders', JSON.stringify(updatedOrders));
        setOrders(updatedOrders);
    }
    
    toast({ title: "Receipt Recorded", description: `Payment from ${customer.name} has been recorded.` });

    setReceiptContactId("");
    setReceiptAmount("");
    setReceiptRef("");
    setSelectedInvoiceId("");
    setReceiptDate(new Date());
  };

  const handleRecordPayment = () => {
     if (!paymentContactId || !paymentAmount || paymentAmount <= 0 || !paymentDate) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a supplier, date and enter a valid amount." });
      return;
    }
    const supplier = contacts.find(c => c.id === paymentContactId);
    if (!supplier) return;

    const paymentDateISO = paymentDate.toISOString();
    const paymentId = `PAY-${Date.now()}`;
    const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem('samarth_furniture_ledger') || '[]');
    const allPurchases: Purchase[] = JSON.parse(localStorage.getItem('samarth_furniture_purchases') || '[]');

    const details = `Paid via ${paymentMethod}. Ref: ${paymentRef || 'N/A'} ${selectedPurchaseId ? `against Bill #${allPurchases.find(p => p.id === selectedPurchaseId)?.billNumber}` : ''}`.trim();

    ledgerEntries.push({
        id: `LEDG-${Date.now()}-D`, date: paymentDateISO, accountId: supplier.id, accountName: supplier.name, type: 'Payment', details, debit: paymentAmount, credit: 0, refId: paymentId,
    });

    ledgerEntries.push({
        id: `LEDG-${Date.now()}-C`, date: paymentDateISO, accountId: 'CASH_BANK_ACCOUNT', accountName: 'Cash/Bank Account', type: 'Payment', details: `To ${supplier.name}`, debit: 0, credit: paymentAmount, refId: paymentId,
    });

    localStorage.setItem('samarth_furniture_ledger', JSON.stringify(ledgerEntries));

     if (selectedPurchaseId) {
      const updatedPurchases = allPurchases.map(p => {
          if (p.id === selectedPurchaseId) {
              const newPayment: Payment = { id: paymentId, date: paymentDateISO, amount: paymentAmount as number, method: paymentMethod };
              const payments = [...(p.payments || []), newPayment];
              const paidAmount = payments.reduce((acc, pay) => acc + pay.amount, 0);
              const balanceDue = p.totalAmount - paidAmount;
              const paymentStatus: PaymentStatus = balanceDue <= 0.01 ? 'Paid' : 'Partially Paid';
              return { ...p, payments, paidAmount, balanceDue, paymentStatus };
          }
          return p;
      });
      localStorage.setItem('samarth_furniture_purchases', JSON.stringify(updatedPurchases));
      setPurchases(updatedPurchases);
    }

    toast({ title: "Payment Recorded", description: `Payment to ${supplier.name} has been recorded.` });

    setPaymentContactId("");
    setPaymentAmount("");
    setPaymentRef("");
    setSelectedPurchaseId("");
    setPaymentDate(new Date());
  };

  const customers = contacts.filter(c => c.type === 'Customer' || c.type === 'Dealer');
  const suppliers = contacts.filter(c => c.type === 'Supplier');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <Banknote className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Vouchers</h2>
      </div>
      <p className="text-muted-foreground">
        Record cash/bank receipts from customers and payments to suppliers.
      </p>
      <Separator />

      <Tabs defaultValue="receipt" className="pt-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="receipt">Receipt Voucher (Money In)</TabsTrigger>
          <TabsTrigger value="payment">Payment Voucher (Money Out)</TabsTrigger>
        </TabsList>

        <TabsContent value="receipt">
          <Card className="mt-2">
            <CardHeader>
              <CardTitle>Record a Receipt</CardTitle>
              <CardDescription>Record a payment received from a customer or dealer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="receiptCustomer">Customer / Dealer</Label>
                        <Select value={receiptContactId} onValueChange={setReceiptContactId}>
                            <SelectTrigger id="receiptCustomer"><SelectValue placeholder="Select a customer..." /></SelectTrigger>
                            <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="receiptInvoice">Against Invoice (Optional)</Label>
                        <Select value={selectedInvoiceId} onValueChange={handleInvoiceSelect} disabled={!receiptContactId || unpaidInvoices.length === 0}>
                            <SelectTrigger id="receiptInvoice"><SelectValue placeholder="Select an unpaid invoice..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="adhoc">None (Ad-hoc receipt)</SelectItem>
                                {unpaidInvoices.map(inv => <SelectItem key={inv.id} value={inv.id}>{`#${inv.invoiceNumber} - ₹${inv.balanceDue?.toFixed(2)}`}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="receiptAmount">Amount</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="receiptAmount" type="number" placeholder="0.00" className="pl-8" value={receiptAmount} onChange={e => setReceiptAmount(parseFloat(e.target.value) || "")} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="receiptDate">Bill Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !receiptDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {receiptDate ? format(receiptDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={receiptDate} onSelect={setReceiptDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="receiptMethod">Payment Method</Label>
                        <Select value={receiptMethod} onValueChange={(v) => setReceiptMethod(v as any)}>
                            <SelectTrigger id="receiptMethod"><SelectValue placeholder="Select method..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="receiptRef">Reference (Optional)</Label>
                        <Input id="receiptRef" placeholder="e.g. Cheque No., Txn ID" value={receiptRef} onChange={e => setReceiptRef(e.target.value)} />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleRecordReceipt}>Record Receipt</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
            <Card className="mt-2">
            <CardHeader>
              <CardTitle>Record a Payment</CardTitle>
              <CardDescription>Record a payment made to a supplier.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="paymentSupplier">Supplier</Label>
                        <Select value={paymentContactId} onValueChange={setPaymentContactId}>
                            <SelectTrigger id="paymentSupplier"><SelectValue placeholder="Select a supplier..." /></SelectTrigger>
                            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentPurchase">Against Bill (Optional)</Label>
                        <Select value={selectedPurchaseId} onValueChange={handlePurchaseSelect} disabled={!paymentContactId || unpaidPurchases.length === 0}>
                            <SelectTrigger id="paymentPurchase"><SelectValue placeholder="Select an unpaid bill..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="adhoc">None (Ad-hoc payment)</SelectItem>
                                {unpaidPurchases.map(p => <SelectItem key={p.id} value={p.id}>{`#${p.billNumber} - ₹${p.balanceDue?.toFixed(2)}`}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="paymentAmount">Amount</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="paymentAmount" type="number" placeholder="0.00" className="pl-8" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value) || "")}/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentDate">Bill Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                            <SelectTrigger id="paymentMethod"><SelectValue placeholder="Select method..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentRef">Reference (Optional)</Label>
                        <Input id="paymentRef" placeholder="e.g. Bill #, Cheque No." value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleRecordPayment}>Record Payment</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
