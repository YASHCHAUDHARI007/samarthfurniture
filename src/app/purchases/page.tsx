
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Trash2, IndianRupee } from "lucide-react";
import type { RawMaterial, Contact, Purchase, LedgerEntry } from "@/lib/types";
import { useRouter } from "next/navigation";

type PurchaseItem = {
  id: string; // Raw material ID
  name: string;
  hsn: string;
  quantity: number | "";
  price: number | "";
};

export default function PurchasesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [allSuppliers, setAllSuppliers] = useState<Contact[]>([]);
  const [allRawMaterials, setAllRawMaterials] = useState<RawMaterial[]>([]);

  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const [supplierName, setSupplierName] = useState("");
  const [supplierGstin, setSupplierGstin] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState("");

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [activeMaterialInput, setActiveMaterialInput] = useState<number | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    setBillDate(new Date().toISOString().split("T")[0]);
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
  }, []);

  const getCompanyStorageKey = (baseKey: string) => {
    if (!activeCompanyId) return null;
    return `samarth_furniture_${activeCompanyId}_${baseKey}`;
  };

  useEffect(() => {
    if (!activeCompanyId) {
        setAllSuppliers([]);
        setAllRawMaterials([]);
        return;
    }
    
    const contactsKey = getCompanyStorageKey('contacts')!;
    const materialsKey = getCompanyStorageKey('raw_materials')!;

    const storedContacts: Contact[] = JSON.parse(localStorage.getItem(contactsKey) || '[]');
    setAllSuppliers(storedContacts.filter(c => c.type === 'Supplier'));
    
    const storedMaterials: RawMaterial[] = JSON.parse(localStorage.getItem(materialsKey) || '[]');
    setAllRawMaterials(storedMaterials);
    
  }, [activeCompanyId]);

  const handleSupplierNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSupplierName(value);

    if (value) {
      const filtered = allSuppliers.filter(s => s.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
      setIsSuggestionsOpen(true);
    } else {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
    }
  };

  const handleSelectSupplier = (supplier: Contact) => {
    setSupplierName(supplier.name);
    setSupplierGstin(supplier.gstin || "");
    setSelectedSupplierId(supplier.id);
    setSuggestions([]);
    setIsSuggestionsOpen(false);
  };
  
  const addPurchaseItem = () => {
    setPurchaseItems(current => [...current, {id: '', name: '', hsn: '', quantity: '', price: ''}]);
  };
  
  const removePurchaseItem = (index: number) => {
    setPurchaseItems(current => current.filter((_, i) => i !== index));
  };
  
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    setPurchaseItems(current => current.map((item, i) => {
        if (i === index) {
            const updatedItem = { ...item, [field]: value };
            
            if (field === 'name') {
              updatedItem.id = '';
            }
            
            if (field === 'id') {
                const selectedMaterial = allRawMaterials.find(m => m.id === value);
                updatedItem.name = selectedMaterial?.name || '';
            }
            return updatedItem;
        }
        return item;
    }));
  };

  const totalAmount = useMemo(() => {
    return purchaseItems.reduce((acc, item) => {
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        const price = typeof item.price === 'number' ? item.price : 0;
        return acc + quantity * price;
    }, 0);
  }, [purchaseItems]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!activeCompanyId) {
        toast({ variant: "destructive", title: "No Active Company", description: "Please select a company."});
        return;
    }

    if (!supplierName || !billNumber || !billDate || purchaseItems.length === 0 || totalAmount <= 0) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill all supplier, bill and item details."});
        return;
    }

    const contactsKey = getCompanyStorageKey('contacts')!;
    const purchasesKey = getCompanyStorageKey('purchases')!;
    const materialsKey = getCompanyStorageKey('raw_materials')!;
    const ledgerKey = getCompanyStorageKey('ledger')!;

    const storedContacts: Contact[] = JSON.parse(localStorage.getItem(contactsKey) || '[]');
    let supplier: Contact | undefined = storedContacts.find(
      (c) => c.type === 'Supplier' && c.name.toLowerCase() === supplierName.toLowerCase()
    );
    let supplierId: string;

    if (supplier) {
        supplierId = supplier.id;
        if(supplier.gstin !== supplierGstin) {
            const updatedContacts = storedContacts.map(c => c.id === supplierId ? {...c, gstin: supplierGstin} : c);
            localStorage.setItem(contactsKey, JSON.stringify(updatedContacts));
            setAllSuppliers(updatedContacts.filter(c => c.type === 'Supplier'));
        }
    } else {
        supplierId = `SUPP-${Date.now()}`;
        supplier = { id: supplierId, name: supplierName, type: 'Supplier', gstin: supplierGstin };
        const updatedContacts = [...storedContacts, supplier];
        localStorage.setItem(contactsKey, JSON.stringify(updatedContacts));
        setAllSuppliers(updatedContacts.filter(c => c.type === 'Supplier'));
    }

    const newPurchase: Purchase = {
        id: `PUR-${Date.now()}`,
        supplierId,
        supplierName,
        billNumber,
        date: new Date(billDate).toISOString(),
        items: purchaseItems.map(item => ({...item, quantity: Number(item.quantity), price: Number(item.price), hsn: item.hsn})).filter(item => item.id),
        totalAmount,
        payments: [],
        paidAmount: 0,
        balanceDue: totalAmount,
        paymentStatus: totalAmount > 0 ? "Unpaid" : "Paid",
    };

    const allPurchases: Purchase[] = JSON.parse(localStorage.getItem(purchasesKey) || '[]');
    localStorage.setItem(purchasesKey, JSON.stringify([...allPurchases, newPurchase]));

    let materials: RawMaterial[] = JSON.parse(localStorage.getItem(materialsKey) || '[]');
    newPurchase.items.forEach(item => {
        const materialIndex = materials.findIndex(m => m.id === item.id);
        if (materialIndex !== -1) {
            materials[materialIndex].quantity += item.quantity;
        }
    });
    localStorage.setItem(materialsKey, JSON.stringify(materials));
    setAllRawMaterials(materials);

    const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem(ledgerKey) || '[]');
    const purchaseDebitEntry: LedgerEntry = {
        id: `LEDG-${Date.now()}-D`, date: newPurchase.date, accountId: 'PURCHASE_ACCOUNT', accountName: 'Purchase Account', type: 'Purchase', details: `Bill #${billNumber} from ${supplierName}`, debit: totalAmount, credit: 0, refId: newPurchase.id,
    };
    const supplierCreditEntry: LedgerEntry = {
        id: `LEDG-${Date.now()}-C`, date: newPurchase.date, accountId: supplierId, accountName: supplierName, type: 'Purchase', details: `Bill #${billNumber}`, debit: 0, credit: totalAmount, refId: newPurchase.id,
    };
    ledgerEntries.push(purchaseDebitEntry, supplierCreditEntry);
    localStorage.setItem(ledgerKey, JSON.stringify(ledgerEntries));

    toast({ title: "Purchase Recorded", description: `Purchase from ${supplierName} has been saved.` });
    
    setSupplierName("");
    setSupplierGstin("");
    setSelectedSupplierId(null);
    setBillNumber("");
    setBillDate(new Date().toISOString().split("T")[0]);
    setPurchaseItems([]);
  };

  if (!activeCompanyId) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
            </CardHeader>
            <CardContent><p>Please select or create a company to manage purchases.</p></CardContent>
            <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
          </Card>
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-7 w-7" />
        <h2 className="text-3xl font-bold tracking-tight">Record Purchase</h2>
      </div>
      <p className="text-muted-foreground">
        Create a new purchase entry to update raw material inventory and supplier ledgers.
      </p>
      <Separator />
      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Create Purchase Bill</CardTitle>
                <CardDescription>Enter supplier, bill, and item details. This will update inventory and supplier ledgers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Supplier & Bill Information</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                        <div className="space-y-2 lg:col-span-1">
                            <Label htmlFor="supplierName">Supplier Name</Label>
                            <div className="relative">
                                <Input
                                    id="supplierName"
                                    placeholder="e.g. Royal Hardware"
                                    required
                                    value={supplierName}
                                    onChange={handleSupplierNameChange}
                                    onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 150)}
                                    autoComplete="off"
                                />
                                {isSuggestionsOpen && suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                                        <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                            {suggestions.map(supplier => (
                                                <div key={supplier.id} className="p-2 hover:bg-muted rounded-md cursor-pointer" onMouseDown={() => handleSelectSupplier(supplier)}>
                                                    {supplier.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supplierGstin">Supplier GSTIN (Optional)</Label>
                            <Input id="supplierGstin" placeholder="e.g. 29ABCDE1234F1Z5" value={supplierGstin} onChange={(e) => setSupplierGstin(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="billNumber">Bill Number</Label>
                            <Input id="billNumber" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="billDate">Bill Date</Label>
                            <Input id="billDate" type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} required />
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Purchased Items</h3>
                     <div className="rounded-md border mt-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[35%]">Material</TableHead>
                                    <TableHead>HSN/SAC</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Price/Unit</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="relative">
                                                <Input
                                                    placeholder="Type or select material"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                    onFocus={() => setActiveMaterialInput(index)}
                                                    onBlur={() => setTimeout(() => setActiveMaterialInput(null), 150)}
                                                    autoComplete="off"
                                                    required
                                                />
                                                {activeMaterialInput === index && (
                                                    <div className="absolute z-20 w-full mt-1 bg-card border rounded-md shadow-lg">
                                                        <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                                            {allRawMaterials
                                                                .filter(material => item.name ? material.name.toLowerCase().includes(item.name.toLowerCase()) : true)
                                                                .map(material => (
                                                                    <div key={material.id} className="p-2 hover:bg-muted rounded-md cursor-pointer" onMouseDown={() => {handleItemChange(index, 'id', material.id); setActiveMaterialInput(null);}}>
                                                                        {material.name}
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input placeholder="e.g. 9403" value={item.hsn} onChange={e => handleItemChange(index, 'hsn', e.target.value)} />
                                        </TableCell>
                                        <TableCell><Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || "")} min="0" placeholder="0"/></TableCell>
                                        <TableCell><Input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || "")} min="0" placeholder="0.00"/></TableCell>
                                        <TableCell className="text-right font-medium">{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}</TableCell>
                                        <TableCell><Button variant="ghost" size="icon" onClick={() => removePurchaseItem(index)} className="text-destructive"><Trash2 className="h-4 w-4"/></Button></TableCell>
                                    </TableRow>
                                ))}
                                {purchaseItems.length === 0 && (
                                    <TableRow><TableCell colSpan={6} className="text-center h-24">No items added.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <Button variant="outline" size="sm" onClick={addPurchaseItem} className="mt-4">Add Item</Button>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-end space-y-4 border-t pt-6">
                <div className="w-full max-w-sm space-y-2">
                     <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <div className="flex items-center">
                            <IndianRupee className="h-5 w-5 mr-1" />
                            <span>{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <Button type="submit" disabled={totalAmount <= 0}>Record Purchase</Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
