
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BookUser, ShieldAlert, Trash2, Edit, PlusCircle } from "lucide-react";
import type { Contact } from "@/lib/types";

export default function ManageContactsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<'Customer' | 'Dealer' | 'Supplier'>('Customer');
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [dealerId, setDealerId] = useState("");

  const getCompanyStorageKey = (baseKey: string) => {
    if (!activeCompanyId) return null;
    return `samarth_furniture_${activeCompanyId}_${baseKey}`;
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "owner" || role === "administrator") {
      setHasAccess(true);
    }
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!activeCompanyId) {
        setContacts([]);
        return;
    }
    const contactsKey = getCompanyStorageKey('contacts')!;
    const storedContacts = JSON.parse(localStorage.getItem(contactsKey) || '[]');
    setContacts(storedContacts);
  }, [activeCompanyId]);

  const resetForm = () => {
    setName("");
    setType("Customer");
    setEmail("");
    setAddress("");
    setGstin("");
    setDealerId("");
    setContactToEdit(null);
  };
  
  const openEditDialog = (contact: Contact) => {
    setContactToEdit(contact);
    setName(contact.name);
    setType(contact.type);
    setEmail(contact.email || "");
    setAddress(contact.address || "");
    setGstin(contact.gstin || "");
    setDealerId(contact.dealerId || "");
    setIsDialogOpen(true);
  };

  const handleFormSubmit = () => {
    if (!name || !type || !activeCompanyId) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    const contactsKey = getCompanyStorageKey('contacts')!;
    const currentContacts: Contact[] = JSON.parse(localStorage.getItem(contactsKey) || '[]');
    let updatedContacts: Contact[];

    if (contactToEdit) {
      // Edit mode
      updatedContacts = currentContacts.map(c => 
        c.id === contactToEdit.id ? { ...c, name, type, email, address, gstin, dealerId: type === 'Dealer' ? dealerId : undefined } : c
      );
      toast({ title: "Contact Updated" });
    } else {
      // Add mode
      if (currentContacts.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        toast({ variant: "destructive", title: "Contact exists", description: "A contact with this name already exists." });
        return;
      }
      const newContact: Contact = {
        id: `CONT-${Date.now()}`, name, type, email, address, gstin, dealerId: type === 'Dealer' ? dealerId : undefined,
      };
      updatedContacts = [...currentContacts, newContact];
      toast({ title: "Contact Created" });
    }
    
    setContacts(updatedContacts);
    localStorage.setItem(contactsKey, JSON.stringify(updatedContacts));
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteContact = () => {
    if (!contactToDelete || !activeCompanyId) return;
    const contactsKey = getCompanyStorageKey('contacts')!;
    const updatedContacts = contacts.filter(c => c.id !== contactToDelete.id);
    setContacts(updatedContacts);
    localStorage.setItem(contactsKey, JSON.stringify(updatedContacts));
    toast({ title: "Contact Deleted", variant: "destructive" });
    setContactToDelete(null);
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive" /> Access Denied</CardTitle></CardHeader>
          <CardContent><p>You do not have permission to manage contacts.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/")}>Return to Dashboard</Button></CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!activeCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <Card className="max-w-md">
          <CardHeader><CardTitle>No Company Selected</CardTitle></CardHeader>
          <CardContent><p>Please select a company to manage contacts.</p></CardContent>
          <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <BookUser className="h-7 w-7" />
                <h2 className="text-3xl font-bold tracking-tight">Manage Contacts</h2>
            </div>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4"/> Add Contact
            </Button>
        </div>
        <p className="text-muted-foreground">
          Create, edit, and manage your customers, dealers, and suppliers.
        </p>
        <Separator />
        
        <Card className="mt-4">
            <CardHeader>
              <CardTitle>Contact List</CardTitle>
              <CardDescription>A list of all contacts for the active company.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.length > 0 ? contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{contact.type}</TableCell>
                        <TableCell>{contact.gstin || 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                           <Button variant="ghost" size="icon" onClick={() => openEditDialog(contact)}><Edit className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => setContactToDelete(contact)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                         <TableRow><TableCell colSpan={4} className="h-24 text-center">No contacts created yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{contactToEdit ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
                <DialogDescription>Fill in the details for the contact below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as any)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Customer">Customer</SelectItem><SelectItem value="Dealer">Dealer</SelectItem><SelectItem value="Supplier">Supplier</SelectItem></SelectContent></Select>
                </div>
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
                {type === 'Dealer' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dealerId" className="text-right">Dealer ID</Label>
                        <Input id="dealerId" value={dealerId} onChange={e => setDealerId(e.target.value)} className="col-span-3" />
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button onClick={handleFormSubmit}>{contactToEdit ? 'Save Changes' : 'Create Contact'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!contactToDelete} onOpenChange={(isOpen) => !isOpen && setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the contact <span className="font-semibold">{contactToDelete?.name}</span>. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Contact</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
