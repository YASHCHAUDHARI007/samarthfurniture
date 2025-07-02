"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BookUser, ShieldAlert, Trash2, Edit, PlusCircle, IndianRupee } from "lucide-react";
import type { Ledger, LedgerGroup } from "@/lib/types";
import { useCompany } from "@/contexts/company-context";

const ledgerGroups: LedgerGroup[] = [
    'Sundry Debtors',
    'Sundry Creditors',
    'Bank Accounts',
    'Capital Account',
    'Direct Expenses',
    'Indirect Expenses',
    'Direct Incomes',
    'Indirect Incomes',
    'Fixed Assets',
    'Current Assets',
    'Cash-in-hand',
    'Loans (Liability)',
    'Current Liabilities',
    'Sales Accounts',
    'Purchase Accounts',
    'Duties & Taxes',
    'Stock-in-Hand',
];

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ledgerToEdit, setLedgerToEdit] = useState<Ledger | null>(null);
  const [ledgerToDelete, setLedgerToDelete] = useState<Ledger | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [group, setGroup] = useState<LedgerGroup>('Sundry Debtors');
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [openingBalance, setOpeningBalance] = useState<number | "">(0);
  const [dealerId, setDealerId] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "owner" || role === "administrator") {
      setHasAccess(true);
    }
  }, []);

  useEffect(() => {
    if (!activeCompany) {
        setLedgers([]);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    const ledgersJson = localStorage.getItem(`ledgers_${activeCompany.id}`);
    const allLedgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
    const filteredLedgers = allLedgers.filter(ledger => !['PROFIT_LOSS', 'SALES_ACCOUNT', 'PURCHASE_ACCOUNT', 'CASH_ACCOUNT'].includes(ledger.id));
    setLedgers(filteredLedgers);
    setIsLoading(false);
  }, [activeCompany]);

  const resetForm = () => {
    setName("");
    setGroup("Sundry Debtors");
    setEmail("");
    setAddress("");
    setGstin("");
    setOpeningBalance(0);
    setDealerId("");
    setLedgerToEdit(null);
  };
  
  const openEditDialog = (ledger: Ledger) => {
    setLedgerToEdit(ledger);
    setName(ledger.name);
    setGroup(ledger.group);
    setEmail(ledger.email || "");
    setAddress(ledger.address || "");
    setGstin(ledger.gstin || "");
    setOpeningBalance(ledger.openingBalance || 0);
    setDealerId(ledger.dealerId || "");
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!name || !group || !activeCompany) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }
    
    const ledgersJson = localStorage.getItem(`ledgers_${activeCompany.id}`);
    let allLedgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];

    if (ledgerToEdit) {
      // Edit mode
      const updatedLedgers = allLedgers.map(l => l.id === ledgerToEdit.id ? { ...l, name, group, email, address, gstin, openingBalance: Number(openingBalance) || 0, dealerId: dealerId || undefined } : l);
      localStorage.setItem(`ledgers_${activeCompany.id}`, JSON.stringify(updatedLedgers));
      setLedgers(updatedLedgers.filter(ledger => !['PROFIT_LOSS', 'SALES_ACCOUNT', 'PURCHASE_ACCOUNT', 'CASH_ACCOUNT'].includes(ledger.id)));
      toast({ title: "Ledger Updated" });
    } else {
      // Add mode
      if (allLedgers.some(l => l.name.toLowerCase() === name.toLowerCase())) {
        toast({ variant: "destructive", title: "Ledger exists", description: "A ledger with this name already exists." });
        return;
      }
      const ledgerId = `LEDG-${Date.now()}`;
      const finalDealerId = (group === 'Sundry Debtors' && !dealerId) ? `DEALER-${Date.now()}` : dealerId;
      const newLedger: Ledger = {
          id: ledgerId,
          name,
          group,
          email,
          address,
          gstin,
          openingBalance: Number(openingBalance) || 0,
          dealerId: finalDealerId || undefined,
      };
      allLedgers.push(newLedger);
      localStorage.setItem(`ledgers_${activeCompany.id}`, JSON.stringify(allLedgers));
      setLedgers(allLedgers.filter(ledger => !['PROFIT_LOSS', 'SALES_ACCOUNT', 'PURCHASE_ACCOUNT', 'CASH_ACCOUNT'].includes(ledger.id)));
      toast({ title: "Ledger Created" });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteLedger = async () => {
    if (!ledgerToDelete || !activeCompany) return;
    
    const ledgersJson = localStorage.getItem(`ledgers_${activeCompany.id}`);
    let allLedgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
    const updatedLedgers = allLedgers.filter(l => l.id !== ledgerToDelete.id);
    localStorage.setItem(`ledgers_${activeCompany.id}`, JSON.stringify(updatedLedgers));
    setLedgers(updatedLedgers.filter(ledger => !['PROFIT_LOSS', 'SALES_ACCOUNT', 'PURCHASE_ACCOUNT', 'CASH_ACCOUNT'].includes(ledger.id)));
    
    toast({ title: "Ledger Deleted", variant: "destructive" });
    setLedgerToDelete(null);
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <div className="border border-destructive p-4 rounded-md bg-destructive/10">
          <h2 className="flex items-center gap-2 font-bold"><ShieldAlert className="text-destructive" /> Access Denied</h2>
          <p>You do not have permission to manage the Chart of Accounts.</p>
          <Button onClick={() => router.push("/")} className="mt-4">Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  if (!activeCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
         <div className="border p-4 rounded-md">
            <h2 className="font-bold">No Company Selected</h2>
            <p>Please select a company to manage the Chart of Accounts.</p>
            <Button onClick={() => router.push("/manage-companies")} className="mt-4">Go to Companies</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <BookUser className="h-7 w-7" />
                <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
            </div>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4"/> Create Ledger
            </Button>
        </div>
        <p className="text-muted-foreground">
          Create, edit, and manage all your ledger accounts.
        </p>
        <Separator />
        
        <div className="border rounded-lg mt-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Ledger List</h3>
              <p className="text-sm text-muted-foreground">A list of all accounts for the active company.</p>
            </div>
            <div className="p-6 pt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ledger Name</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgers.length > 0 ? ledgers.map((ledger) => (
                      <TableRow key={ledger.id}>
                        <TableCell className="font-medium">{ledger.name}</TableCell>
                        <TableCell>{ledger.group}</TableCell>
                        <TableCell>{ledger.gstin || 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                           <Button variant="ghost" size="icon" onClick={() => openEditDialog(ledger)}><Edit className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => setLedgerToDelete(ledger)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                         <TableRow><TableCell colSpan={4} className="h-24 text-center">No ledgers created yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{ledgerToEdit ? 'Edit Ledger' : 'Create New Ledger'}</DialogTitle>
                <DialogDescription>Fill in the details for the ledger account below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="group" className="text-right">Group</Label>
                    <Select value={group} onValueChange={(v) => setGroup(v as any)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sundry Debtors">Sundry Debtors</SelectItem><SelectItem value="Sundry Creditors">Sundry Creditors</SelectItem><Separator /><SelectItem value="Bank Accounts">Bank Accounts</SelectItem><SelectItem value="Capital Account">Capital Account</SelectItem><SelectItem value="Direct Expenses">Direct Expenses</SelectItem><SelectItem value="Indirect Expenses">Indirect Expenses</SelectItem><SelectItem value="Direct Incomes">Direct Incomes</SelectItem><SelectItem value="Indirect Incomes">Indirect Incomes</SelectItem><SelectItem value="Fixed Assets">Fixed Assets</SelectItem><SelectItem value="Current Assets">Current Assets</SelectItem><SelectItem value="Cash-in-hand">Cash-in-hand</SelectItem><SelectItem value="Loans (Liability)">Loans (Liability)</SelectItem><SelectItem value="Current Liabilities">Current Liabilities</SelectItem><SelectItem value="Sales Accounts">Sales Accounts</SelectItem><SelectItem value="Purchase Accounts">Purchase Accounts</SelectItem><SelectItem value="Duties & Taxes">Duties & Taxes</SelectItem><SelectItem value="Stock-in-Hand">Stock-in-Hand</SelectItem></SelectContent></Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="openingBalance" className="text-right">Op. Balance</Label>
                    <div className="relative col-span-3">
                         <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="openingBalance" type="number" value={openingBalance} onChange={e => setOpeningBalance(parseFloat(e.target.value) || "")} className="pl-8" />
                    </div>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">Optional Details</p>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">Address</Label>
                    <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gstin" className="text-right">GSTIN</Label>
                    <Input id="gstin" value={gstin} onChange={e => setGstin(e.target.value)} className="col-span-3" />
                </div>
                {group === 'Sundry Debtors' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dealerId" className="text-right">Dealer ID</Label>
                      <Input id="dealerId" value={dealerId} onChange={e => setDealerId(e.target.value)} className="col-span-3" placeholder="Auto-generated if empty" />
                  </div>
                )}
            </div>
            <DialogFooter>
                <Button onClick={handleFormSubmit}>{ledgerToEdit ? 'Save Changes' : 'Create Ledger'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!ledgerToDelete} onOpenChange={(isOpen) => !isOpen && setLedgerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the ledger <span className="font-semibold">{ledgerToDelete?.name}</span>. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLedger} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Ledger</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
