
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from "@/hooks/use-toast";
import { Building2, ShieldAlert, Trash2, Edit } from "lucide-react";
import type { Company, Ledger } from "@/lib/types";
import { supabase } from "@/lib/supabase";


const SafeFormatDate = ({ dateString }: { dateString: string }) => {
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return <>{format(date, "dd-MMM-yyyy")}</>;
      }
    } catch (e) {
      //
    }
    return <>{dateString || 'Invalid Date'}</>;
};


export default function ManageCompaniesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newFyStart, setNewFyStart] = useState("");
  const [newFyEnd, setNewFyEnd] = useState("");

  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  
  const [editName, setEditName] = useState("");
  const [editFyStart, setEditFyStart] = useState("");
  const [editFyEnd, setEditFyEnd] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "owner" || role === "administrator") {
      setHasAccess(true);
    }
    
    const fetchCompanies = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('companies').select('*');
      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching companies', description: error.message });
      } else {
        setCompanies(data || []);
      }
      setIsLoading(false);
    }
    fetchCompanies();
    
  }, [toast]);

  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCompanyName || !newFyStart || !newFyEnd) {
      toast({ variant: "destructive", title: "Missing Information" });
      return;
    }
    const newCompany: Omit<Company, 'id'> = {
      name: newCompanyName,
      financialYearStart: newFyStart,
      financialYearEnd: newFyEnd,
    };

    const { data: insertedCompany, error } = await supabase.from('companies').insert(newCompany).select().single();

    if (error) {
       toast({ variant: "destructive", title: "Failed to create company", description: error.message });
       return;
    }
    
    setCompanies([...companies, insertedCompany]);
    
    // Auto-create essential ledgers for the new company
    const initialLedgers: Omit<Ledger, 'id' | 'company_id'>[] = [
        { name: 'Profit & Loss A/c', group: 'Primary', openingBalance: 0 },
        { name: 'Sales Account', group: 'Sales Accounts', openingBalance: 0 },
        { name: 'Purchase Account', group: 'Purchase Accounts', openingBalance: 0 },
        { name: 'Cash', group: 'Cash-in-hand', openingBalance: 0 },
    ];
    const ledgersToInsert = initialLedgers.map(l => ({ ...l, company_id: insertedCompany.id }));
    const { error: ledgerError } = await supabase.from('ledgers').insert(ledgersToInsert);
    if (ledgerError) {
        toast({ variant: 'destructive', title: 'Ledger setup failed', description: `Company created, but failed to create default ledgers: ${ledgerError.message}`});
    }


    // If it's the first company, set it as active
    if (!localStorage.getItem('activeCompanyId')) {
        localStorage.setItem('activeCompanyId', insertedCompany.id);
        window.location.reload(); // Reload to apply company context
    }
    
    toast({ title: "Company Created", description: `${newCompanyName} has been created successfully.` });
    setNewCompanyName("");
    setNewFyStart("");
    setNewFyEnd("");
  };

  const handleEditCompany = async () => {
    if (!companyToEdit || !editName || !editFyStart || !editFyEnd) return;
    
    const updates = { name: editName, financialYearStart: editFyStart, financialYearEnd: editFyEnd };
    const { error } = await supabase.from('companies').update(updates).eq('id', companyToEdit.id);

    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    } else {
      setCompanies(companies.map(c => 
        c.id === companyToEdit.id ? { ...c, ...updates } : c
      ));
      toast({ title: "Company Updated" });
      setCompanyToEdit(null);
    }
  };
  
  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    const tablesToDeleteFrom = ['orders', 'ledgers', 'purchases', 'ledger_entries', 'raw_materials', 'stock_items', 'locations', 'products'];
    
    for (const table of tablesToDeleteFrom) {
      const { error } = await supabase.from(table).delete().eq('company_id', companyToDelete.id);
       if (error) {
          console.error(`Error deleting from ${table}:`, error.message);
          // Optionally, show a more detailed error to the user.
       }
    }
    
    const { error } = await supabase.from('companies').delete().eq('id', companyToDelete.id);

    if (error) {
       toast({ title: "Company Deletion Failed", variant: "destructive", description: error.message });
    } else {
      setCompanies(companies.filter(c => c.id !== companyToDelete.id));
      toast({ title: "Company Deleted", variant: "destructive" });
      if (localStorage.getItem('activeCompanyId') === companyToDelete.id) {
          localStorage.removeItem('activeCompanyId');
          window.location.reload();
      }
    }
    setCompanyToDelete(null);
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive" /> Access Denied</CardTitle>
          </CardHeader>
          <CardContent><p>You do not have permission to manage companies.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/")}>Return to Dashboard</Button></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-7 w-7" />
          <h2 className="text-3xl font-bold tracking-tight">Manage Companies</h2>
        </div>
        <p className="text-muted-foreground">
          Create and manage different company accounts.
        </p>
        <Separator />

        <div className="grid md:grid-cols-2 gap-8 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Company</CardTitle>
              <CardDescription>Create a new company account. This will create a separate data environment.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAddCompany}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newCompanyName">Company Name</Label>
                  <Input id="newCompanyName" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newFyStart">Financial Year Start</Label>
                    <Input id="newFyStart" type="date" value={newFyStart} onChange={(e) => setNewFyStart(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newFyEnd">Financial Year End</Label>
                    <Input id="newFyEnd" type="date" value={newFyEnd} onChange={(e) => setNewFyEnd(e.target.value)} required />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Create Company</Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Companies</CardTitle>
              <CardDescription>A list of all companies in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Financial Year</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>
                          <SafeFormatDate dateString={company.financialYearStart} /> to <SafeFormatDate dateString={company.financialYearEnd} />
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Dialog onOpenChange={(open) => !open && setCompanyToEdit(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setCompanyToEdit(company);
                                    setEditName(company.name);
                                    setEditFyStart(company.financialYearStart);
                                    setEditFyEnd(company.financialYearEnd);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Company: {company.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="editName">Company Name</Label>
                                        <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="editFyStart">Financial Year Start</Label>
                                        <Input id="editFyStart" type="date" value={editFyStart} onChange={(e) => setEditFyStart(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editFyEnd">Financial Year End</Label>
                                        <Input id="editFyEnd" type="date" value={editFyEnd} onChange={(e) => setEditFyEnd(e.target.value)} required />
                                    </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleEditCompany}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCompanyToDelete(company)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!companyToDelete} onOpenChange={(isOpen) => !isOpen && setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the company <span className="font-semibold">{companyToDelete?.name}</span> and all of its associated data (orders, customers, etc.). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
