"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookText, IndianRupee } from "lucide-react";
import type { Ledger, LedgerEntry, Order, Purchase, Company } from "@/lib/types";
import { Invoice } from "@/components/invoice";
import { useCompany } from "@/contexts/company-context";

export default function LedgerDetailPage({ params }: { params: { accountId: string } }) {
  const { accountId } = params;
  const { activeCompany } = useCompany();
  const [allLedgerEntries, setAllLedgerEntries] = useState<LedgerEntry[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [account, setAccount] = useState<Ledger | null>(null);

  const [billToView, setBillToView] = useState<Order | Purchase | null>(null);

  useEffect(() => {
    if (!activeCompany) return;

    const ledgerEntriesJson = localStorage.getItem(`ledger_entries_${activeCompany.id}`);
    setAllLedgerEntries(ledgerEntriesJson ? JSON.parse(ledgerEntriesJson) : []);

    const ledgersJson = localStorage.getItem(`ledgers_${activeCompany.id}`);
    const ledgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
    setAccount(ledgers.find(acc => acc.id === accountId) || null);
    
    const ordersJson = localStorage.getItem(`orders_${activeCompany.id}`);
    setAllOrders(ordersJson ? JSON.parse(ordersJson) : []);
    
    const purchasesJson = localStorage.getItem(`purchases_${activeCompany.id}`);
    setAllPurchases(purchasesJson ? JSON.parse(purchasesJson) : []);

  }, [accountId, activeCompany]);

  const displayedEntries = useMemo(() => {
    if (!account) return [];

    const filtered = allLedgerEntries
      .filter(entry => entry.accountId === account.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = account.openingBalance || 0;
    return filtered.map(entry => {
        runningBalance += entry.debit - entry.credit;
        return { ...entry, runningBalance };
    });
  }, [account, allLedgerEntries]);
  
  const finalBalance = displayedEntries.length > 0 ? displayedEntries[displayedEntries.length - 1].runningBalance : (account?.openingBalance || 0);
  const balanceType = finalBalance >= 0 ? "Dr" : "Cr";

  const handleViewBill = (entry: LedgerEntry) => {
    if (entry.type === 'Sales') {
        const order = allOrders.find(o => o.id === entry.refId);
        if(order) setBillToView(order);
    }
    if (entry.type === 'Purchase') {
        const purchase = allPurchases.find(p => p.id === entry.refId);
        if(purchase) setBillToView(purchase);
    }
  };
  
  const isPurchase = (bill: any): bill is Purchase => bill && 'supplierId' in bill;

  if (!account) {
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground p-8">
                    <BookText className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">Account not found</h3>
                    <p>The requested ledger account could not be found for the active company.</p>
                </div>
            </div>
        </div>
      );
  }

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div id="printable-area">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Statement for: {account.name}</CardTitle>
                        <CardDescription>A detailed history of all transactions for this account.</CardDescription>
                    </div>
                    <Button onClick={() => window.print()} className="no-print">Print Statement</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Particulars</TableHead>
                        <TableHead className="w-[120px]">Vch Type</TableHead>
                        <TableHead className="w-[120px] text-right">Debit</TableHead>
                        <TableHead className="w-[120px] text-right">Credit</TableHead>
                        <TableHead className="w-[150px] text-right">Running Balance</TableHead>
                        <TableHead className="w-[100px] text-center no-print">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {account.openingBalance && account.openingBalance !== 0 ? (
                            <TableRow>
                                <TableCell>{/* Assuming FY start date */}</TableCell>
                                <TableCell className="font-semibold">Opening Balance</TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-right font-mono">{account.openingBalance > 0 ? account.openingBalance.toFixed(2) : ''}</TableCell>
                                <TableCell className="text-right font-mono">{account.openingBalance < 0 ? Math.abs(account.openingBalance).toFixed(2) : ''}</TableCell>
                                <TableCell className="text-right font-mono">
                                    {Math.abs(account.openingBalance).toFixed(2)} {account.openingBalance >= 0 ? 'Dr' : 'Cr'}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        ) : null}
                        {displayedEntries.length > 0 ? displayedEntries.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                                <TableCell>{entry.details}</TableCell>
                                <TableCell>{entry.type}</TableCell>
                                <TableCell className="text-right font-mono">{entry.debit > 0 ? entry.debit.toFixed(2) : ''}</TableCell>
                                <TableCell className="text-right font-mono">{entry.credit > 0 ? entry.credit.toFixed(2) : ''}</TableCell>
                                <TableCell className="text-right font-mono">
                                    {Math.abs(entry.runningBalance).toFixed(2)} {entry.runningBalance >= 0 ? 'Dr' : 'Cr'}
                                </TableCell>
                                <TableCell className="text-center no-print">
                                    {(entry.type === 'Sales' || entry.type === 'Purchase') && (
                                        <Button variant="outline" size="sm" onClick={() => handleViewBill(entry)}>View Bill</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                           !account.openingBalance && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">No transactions for this account.</TableCell>
                            </TableRow>
                           )
                        )}
                    </TableBody>
                    </Table>
                </div>
                {(displayedEntries.length > 0 || account.openingBalance) && (
                        <div className="flex justify-end mt-4">
                            <div className="w-full max-w-xs space-y-2 text-right">
                                <div className="flex justify-between font-bold text-base">
                                    <span>Closing Balance</span>
                                    <div className="flex items-center">
                                        <IndianRupee className="h-4 w-4 mr-1" />
                                        <span>{Math.abs(finalBalance).toFixed(2)} {balanceType}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </CardContent>
        </Card>
      </div>
    </div>

    <Dialog open={!!billToView} onOpenChange={(isOpen) => !isOpen && setBillToView(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
           {billToView && (
               isPurchase(billToView) ? (
                    <>
                    <DialogHeader>
                        <DialogTitle>Purchase Bill: {billToView.billNumber}</DialogTitle>
                        <DialogDescription>Details of purchase from {billToView.supplierName}.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><strong>Supplier:</strong> {billToView.supplierName}</div>
                            <div className="text-right"><strong>Bill Date:</strong> {new Date(billToView.date).toLocaleDateString()}</div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Material</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Price/Unit</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billToView.items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-mono">₹{item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono">₹{(item.quantity * item.price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-end pt-4">
                            <div className="w-full max-w-sm space-y-2">
                                 <div className="flex justify-between text-lg font-bold">
                                    <span>Total Amount</span>
                                    <div className="flex items-center font-mono">
                                        <IndianRupee className="h-5 w-5 mr-1" />
                                        <span>{billToView.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
               ) : (
                    <>
                    <DialogHeader className="no-print">
                        <DialogTitle>Invoice: {billToView.invoiceNumber}</DialogTitle>
                        <DialogDescription>Invoice details for order {billToView.id}.</DialogDescription>
                    </DialogHeader>
                    <div id="printable-area" className="flex-grow overflow-y-auto bg-gray-100 print:bg-white p-4 print:p-0">
                       <Invoice order={billToView} company={activeCompany} />
                    </div>
                    </>
               )
           )}
           <div className="flex justify-end gap-2 no-print">
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            {!isPurchase(billToView) && <Button onClick={() => window.print()}>Print Invoice</Button>}
           </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
