
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
  const [hasAccess, setHasAccess] = useState(false);
  const [isTallyTheme, setIsTallyTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  
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

  const getCompanyStorageKey = (baseKey: string) => {
    if (!activeCompanyId) return null;
    return `samarth_furniture_${activeCompanyId}_${baseKey}`;
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "owner" || role === "administrator") {
      setHasAccess(true);
    }
    if (role === "administrator") {
      setIsTallyTheme(true);
    }
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!activeCompanyId) {
        setLedgers([]);
        return;
    }
    const ledgersKey = getCompanyStorageKey('ledgers')!;
    const storedLedgers = JSON.parse(localStorage.getItem(ledgersKey) || '[]');
    setLedgers(storedLedgers);
  }, [activeCompanyId]);

  const resetForm = () => {
    setName("");
    setGroup("Sundry Debtors");
    setEmail("");
    setAddress("");
    setGstin("");
    setOpeningBalance(0);
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
    setIsDialogOpen(true);
  };

  const handleFormSubmit = () => {
    if (!name || !group || !activeCompanyId) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    const ledgersKey = getCompanyStorageKey('ledgers')!;
    const currentLedgers: Ledger[] = JSON.parse(localStorage.getItem(ledgersKey) || '[]');
    let updatedLedgers: Ledger[];

    const ledgerData = {
        name,
        group,
        email,
        address,
        gstin,
        openingBalance: Number(openingBalance) || 0
    };

    if (ledgerToEdit) {
      // Edit mode
      updatedLedgers = currentLedgers.map(l => 
        l.id === ledgerToEdit.id ? { ...l, ...ledgerData } : l
      );
      toast({ title: "Ledger Updated" });
    } else {
      // Add mode
      if (currentLedgers.some(l => l.name.toLowerCase() === name.toLowerCase())) {
        toast({ variant: "destructive", title: "Ledger exists", description: "A ledger with this name already exists." });
        return;
      }
      const newLedger: Ledger = {
        id: `LEDG-${Date.now()}`,
        ...ledgerData
      };
      updatedLedgers = [...currentLedgers, newLedger];
      toast({ title: "Ledger Created" });
    }
    
    setLedgers(updatedLedgers);
    localStorage.setItem(ledgersKey, JSON.stringify(updatedLedgers));
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteLedger = () => {
    if (!ledgerToDelete || !activeCompanyId) return;
    const ledgersKey = getCompanyStorageKey('ledgers')!;
    const updatedLedgers = ledgers.filter(l => l.id !== ledgerToDelete.id);
    setLedgers(updatedLedgers);
    localStorage.setItem(ledgersKey, JSON.stringify(updatedLedgers));
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
  
  if (!activeCompanyId) {
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

  if (isTallyTheme) {
      return (
        <>
            <div className="border border-tally-border p-2 space-y-2 h-full flex flex-col bg-white">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-center font-bold text-lg uppercase flex-grow">List of Ledgers</h2>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-tally-header-bg text-tally-header-fg hover:bg-tally-header-bg/90 rounded-none px-4 py-1 h-auto border border-tally-border">
                        C<span className="underline">r</span>eate
                    </Button>
                </div>
                <div className="flex-grow border border-tally-border overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-tally-header-bg">
                                <TableHead className="text-tally-header-fg font-bold border-tally-border">Name of Ledger</TableHead>
                                <TableHead className="text-tally-header-fg font-bold border-tally-border">Under</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ledgers.length > 0 ? ledgers.map((ledger) => (
                            <TableRow key={ledger.id} className="hover:bg-tally-accent/20 cursor-pointer border-tally-border" onDoubleClick={() => openEditDialog(ledger)}>
                                <TableCell>{ledger.name}</TableCell>
                                <TableCell>{ledger.group}</TableCell>
                            </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={2} className="h-24 text-center">No ledgers created yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {/* Dialogs remain for functionality */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } }}>
              <DialogContent className="tally-theme">
                  <DialogHeader>
                      <DialogTitle>{ledgerToEdit ? 'Ledger Alteration' : 'Ledger Creation'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Name</Label>
                          <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="group" className="text-right">(alias)</Label>
                          <Input className="col-span-3" disabled />
                      </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="group" className="text-right">Under</Label>
                          <Select value={group} onValueChange={(v) => setGroup(v as any)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sundry Debtors">Sundry Debtors</SelectItem><SelectItem value="Sundry Creditors">Sundry Creditors</SelectItem><Separator /><SelectItem value="Bank Accounts">Bank Accounts</SelectItem><SelectItem value="Capital Account">Capital Account</SelectItem><SelectItem value="Direct Expenses">Direct Expenses</SelectItem><SelectItem value="Indirect Expenses">Indirect Expenses</SelectItem><SelectItem value="Direct Incomes">Direct Incomes</SelectItem><SelectItem value="Indirect Incomes">Indirect Incomes</SelectItem><SelectItem value="Fixed Assets">Fixed Assets</SelectItem><SelectItem value="Current Assets">Current Assets</SelectItem><SelectItem value="Cash-in-hand">Cash-in-hand</SelectItem><SelectItem value="Loans (Liability)">Loans (Liability)</SelectItem><SelectItem value="Current Liabilities">Current Liabilities</SelectItem><SelectItem value="Sales Accounts">Sales Accounts</SelectItem><SelectItem value="Purchase Accounts">Purchase Accounts</SelectItem><SelectItem value="Duties & Taxes">Duties & Taxes</SelectItem><SelectItem value="Stock-in-Hand">Stock-in-Hand</SelectItem></SelectContent></Select>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">Mailing Details</p>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="address" className="text-right">Address</Label>
                          <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="col-span-3" />
                      </div>
                       <p className="text-sm text-muted-foreground">Tax Registration Details</p>
                       <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="gstin" className="text-right">GSTIN/UIN</Label>
                          <Input id="gstin" value={gstin} onChange={e => setGstin(e.target.value)} className="col-span-3" />
                      </div>
                      <Separator />
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="openingBalance" className="text-right">Opening Balance</Label>
                          <div className="relative col-span-3">
                              <Input id="openingBalance" type="number" value={openingBalance} onChange={e => setOpeningBalance(parseFloat(e.target.value) || "")} className="pl-8" placeholder="0.00"/>
                          </div>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button onClick={handleFormSubmit}>Accept</Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
        </>
      );
  }

  // Original UI for other roles
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
