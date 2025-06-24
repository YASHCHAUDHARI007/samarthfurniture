
"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Banknote, IndianRupee } from "lucide-react";
import type { Contact, LedgerEntry, Order, Purchase } from "@/lib/types";

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

  // States for Payment Voucher
  const [paymentContactId, setPaymentContactId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Other'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState("");


  useEffect(() => {
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    setContacts(storedContacts);
    const storedOrders: Order[] = JSON.parse(localStorage.getItem('samarth_furniture_orders') || '[]');
    setOrders(storedOrders);
    const storedPurchases: Purchase[] = JSON.parse(localStorage.getItem('samarth_furniture_purchases') || '[]');
    setPurchases(storedPurchases);
  }, []);

  const handleRecordReceipt = () => {
    if (!receiptContactId || !receiptAmount || receiptAmount <= 0) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a customer and enter a valid amount." });
      return;
    }
    const customer = contacts.find(c => c.id === receiptContactId);
    if (!customer) return;

    const paymentDate = new Date().toISOString();
    const paymentId = `PAY-${Date.now()}`;
    const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem('samarth_furniture_ledger') || '[]');
    
    // Credit the customer
    ledgerEntries.push({
      id: `LEDG-${Date.now()}-C`,
      date: paymentDate,
      accountId: customer.id,
      accountName: customer.name,
      type: 'Receipt',
      details: `Received via ${receiptMethod}. Ref: ${receiptRef || 'N/A'}`,
      debit: 0,
      credit: receiptAmount,
      refId: paymentId,
    });
    
    // Debit Cash/Bank
    ledgerEntries.push({
      id: `LEDG-${Date.now()}-D`,
      date: paymentDate,
      accountId: 'CASH_BANK_ACCOUNT',
      accountName: 'Cash/Bank Account',
      type: 'Receipt',
      details: `From ${customer.name}`,
      debit: receiptAmount,
      credit: 0,
      refId: paymentId,
    });

    localStorage.setItem('samarth_furniture_ledger', JSON.stringify(ledgerEntries));
    toast({ title: "Receipt Recorded", description: `Payment from ${customer.name} has been recorded.` });

    // Reset form
    setReceiptContactId("");
    setReceiptAmount("");
    setReceiptRef("");
  };

  const handleRecordPayment = () => {
     if (!paymentContactId || !paymentAmount || paymentAmount <= 0) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a supplier and enter a valid amount." });
      return;
    }
    const supplier = contacts.find(c => c.id === paymentContactId);
    if (!supplier) return;

    const paymentDate = new Date().toISOString();
    const paymentId = `PAY-${Date.now()}`;
    const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem('samarth_furniture_ledger') || '[]');

    // Debit the supplier
    ledgerEntries.push({
        id: `LEDG-${Date.now()}-D`,
        date: paymentDate,
        accountId: supplier.id,
        accountName: supplier.name,
        type: 'Payment',
        details: `Paid via ${paymentMethod}. Ref: ${paymentRef || 'N/A'}`,
        debit: paymentAmount,
        credit: 0,
        refId: paymentId,
    });

    // Credit Cash/Bank
    ledgerEntries.push({
        id: `LEDG-${Date.now()}-C`,
        date: paymentDate,
        accountId: 'CASH_BANK_ACCOUNT',
        accountName: 'Cash/Bank Account',
        type: 'Payment',
        details: `To ${supplier.name}`,
        debit: 0,
        credit: paymentAmount,
        refId: paymentId,
    });

    localStorage.setItem('samarth_furniture_ledger', JSON.stringify(ledgerEntries));
    toast({ title: "Payment Recorded", description: `Payment to ${supplier.name} has been recorded.` });

    // Reset form
    setPaymentContactId("");
    setPaymentAmount("");
    setPaymentRef("");
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
              <CardDescription>
                Record a payment received from a customer or dealer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="receiptCustomer">Customer / Dealer</Label>
                        <Select value={receiptContactId} onValueChange={setReceiptContactId}>
                            <SelectTrigger id="receiptCustomer">
                                <SelectValue placeholder="Select a customer..." />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="receiptAmount">Amount</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="receiptAmount" type="number" placeholder="0.00" className="pl-8" value={receiptAmount} onChange={e => setReceiptAmount(parseFloat(e.target.value) || "")} />
                        </div>
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
              <CardDescription>
                Record a payment made to a supplier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="paymentSupplier">Supplier</Label>
                        <Select value={paymentContactId} onValueChange={setPaymentContactId}>
                            <SelectTrigger id="paymentSupplier">
                                <SelectValue placeholder="Select a supplier..." />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentAmount">Amount</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="paymentAmount" type="number" placeholder="0.00" className="pl-8" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value) || "")}/>
                        </div>
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
