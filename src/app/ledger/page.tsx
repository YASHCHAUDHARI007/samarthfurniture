
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookText, IndianRupee } from "lucide-react";
import type { Contact, LedgerEntry } from "@/lib/types";

const internalAccounts = [
    { id: 'SALES_ACCOUNT', name: 'Sales Account' },
    { id: 'PURCHASE_ACCOUNT', name: 'Purchase Account' },
    { id: 'CASH_BANK_ACCOUNT', name: 'Cash/Bank Account' },
];

export default function LedgerPage() {
  const [allLedgerEntries, setAllLedgerEntries] = useState<LedgerEntry[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  useEffect(() => {
    const storedEntries: LedgerEntry[] = JSON.parse(localStorage.getItem('samarth_furniture_ledger') || '[]');
    setAllLedgerEntries(storedEntries);
    
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    setAllContacts(storedContacts);
  }, []);

  const ledgerAccounts = useMemo(() => {
    return [...internalAccounts, ...allContacts].sort((a,b) => a.name.localeCompare(b.name));
  }, [allContacts]);

  const displayedEntries = useMemo(() => {
    if (!selectedAccountId) return [];

    const filtered = allLedgerEntries
      .filter(entry => entry.accountId === selectedAccountId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    return filtered.map(entry => {
        runningBalance += entry.debit - entry.credit;
        return { ...entry, runningBalance };
    });
  }, [selectedAccountId, allLedgerEntries]);
  
  const finalBalance = displayedEntries.length > 0 ? displayedEntries[displayedEntries.length - 1].runningBalance : 0;
  const balanceType = finalBalance >= 0 ? "Dr" : "Cr";


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <BookText className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Ledger</h2>
      </div>
      <p className="text-muted-foreground">
        View the detailed transaction history for any account.
      </p>
      <Separator />

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                  <CardTitle>Account Ledger</CardTitle>
                  <CardDescription>
                      Select an account to view its statement.
                  </CardDescription>
              </div>
              <div className="w-full md:w-72">
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger>
                          <SelectValue placeholder="Select an account..." />
                      </SelectTrigger>
                      <SelectContent>
                          {ledgerAccounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedAccountId ? (
                    displayedEntries.length > 0 ? displayedEntries.map((entry) => (
                        <TableRow key={entry.id}>
                            <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                            <TableCell>{entry.details}</TableCell>
                            <TableCell>{entry.type}</TableCell>
                            <TableCell className="text-right font-mono">{entry.debit > 0 ? entry.debit.toFixed(2) : ''}</TableCell>
                            <TableCell className="text-right font-mono">{entry.credit > 0 ? entry.credit.toFixed(2) : ''}</TableCell>
                            <TableCell className="text-right font-mono">
                                {Math.abs(entry.runningBalance).toFixed(2)} {entry.runningBalance >= 0 ? 'Dr' : 'Cr'}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">No transactions for this account.</TableCell>
                        </TableRow>
                    )
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">Please select an account to view the ledger.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           {displayedEntries.length > 0 && (
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
  );
}

