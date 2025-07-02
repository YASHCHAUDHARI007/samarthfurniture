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
import { ShoppingCart, Trash2, IndianRupee, ShieldAlert } from "lucide-react";
import type { RawMaterial, Ledger, Purchase, LedgerEntry } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCompany } from "@/contexts/company-context";

type PurchaseItem = {
  id: string; // Raw material stock ID
  name: string;
  hsn: string;
  quantity: number | "";
  price: number | "";
};

export default function PurchasesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeCompany, isLoading: isCompanyLoading } = useCompany();
  const [allSuppliers, setAllSuppliers] = useState<Ledger[]>([]);
  const [allRawMaterials, setAllRawMaterials] = useState<RawMaterial[]>([]);
  const [hasAccess, setHasAccess] = useState(false);

  // State for supplier autocomplete
  const [supplierSuggestions, setSupplierSuggestions] = useState<Ledger[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Form state
  const [supplierName, setSupplierName] = useState("");
  const [supplierGstin, setSupplierGstin] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState("");

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{id: '', name: '', hsn: '', quantity: '', price: ''}]);
  
  // State for material autocomplete in table rows
  const [activeMaterialInput, setActiveMaterialInput] = useState<number | null>(null);
  const [materialSuggestions, setMaterialSuggestions] = useState<RawMaterial[]>([]);
  
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "owner" || role === "administrator") {
      setHasAccess(true);
    }
    setBillDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!activeCompany) {
        setAllSuppliers([]);
        setAllRawMaterials([]);
        return;
    }
    
    const ledgersJson = localStorage.getItem(`ledgers_${activeCompany.id}`);
    const ledgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
    setAllSuppliers(ledgers.filter(c => c.group === 'Sundry Creditors'));
    
    const materialsJson = localStorage.getItem(`raw_materials_${activeCompany.id}`);
    setAllRawMaterials(materialsJson ? JSON.parse(materialsJson) : []);

  }, [activeCompany]);

  // Supplier handlers
  const handleSupplierNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSupplierName(value);
    setSelectedSupplierId(null); // Clear selected ID when name changes

    if (value) {
      const filtered = allSuppliers.filter(s => s.name.toLowerCase().includes(value.toLowerCase()));
      setSupplierSuggestions(filtered);
      setIsSuggestionsOpen(true);
    } else {
      setSupplierSuggestions([]);
      setIsSuggestionsOpen(false);
    }
  };

  const handleSelectSupplier = (supplier: Ledger) => {
    setSupplierName(supplier.name);
    setSupplierGstin(supplier.gstin || "");
    setSelectedSupplierId(supplier.id);
    setSupplierSuggestions([]);
    setIsSuggestionsOpen(false);
  };
  
  // Line item handlers
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
            
            // If name is changed manually, search for suggestions
            if (field === 'name') {
              updatedItem.id = '';
              const searchVal = String(value).toLowerCase();
              if(searchVal) {
                setMaterialSuggestions(allRawMaterials.filter(m => m.name.toLowerCase().includes(searchVal)));
              } else {
                setMaterialSuggestions([]);
              }
            }
            
            // If a material is selected from suggestions, update name
            if (field === 'id') {
                const selectedMaterial = allRawMaterials.find(m => m.id === value);
                if (selectedMaterial) {
                    updatedItem.name = selectedMaterial.name;
                }
            }
            return updatedItem;
        }
        return item;
    }));
  };

  const handleSelectMaterial = (index: number, material: RawMaterial) => {
      handleItemChange(index, 'id', material.id);
      handleItemChange(index, 'name', material.name);
      setMaterialSuggestions([]);
      setActiveMaterialInput(null);
  };


  const totalAmount = useMemo(() => {
    return purchaseItems.reduce((acc, item) => {
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        const price = typeof item.price === 'number' ? item.price : 0;
        return acc + quantity * price;
    }, 0);
  }, [purchaseItems]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!activeCompany) {
        toast({ variant: "destructive", title: "No Active Company", description: "Please select a company."});
        return;
    }
    const activeCompanyId = activeCompany.id;
    
    const validItems = purchaseItems.filter(item => item.id && (item.quantity || 0) > 0 && (item.price || 0) >= 0);

    if (!supplierName || !billNumber || !billDate || validItems.length === 0) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill all supplier, bill and valid item details."});
        return;
    }
    
    try {
        const ledgersJson = localStorage.getItem(`ledgers_${activeCompanyId}`);
        let allLedgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
        let supplier = allLedgers.find(c => c.id === selectedSupplierId);
        let supplierId: string;

        if (supplier) {
            supplierId = supplier.id;
            if(supplier.gstin !== supplierGstin) {
                allLedgers = allLedgers.map(l => l.id === supplierId ? { ...l, gstin: supplierGstin } : l);
                localStorage.setItem(`ledgers_${activeCompanyId}`, JSON.stringify(allLedgers));
            }
        } else {
            supplierId = `LEDG-${Date.now()}`;
            allLedgers.push({ id: supplierId, name: supplierName, group: 'Sundry Creditors', gstin: supplierGstin });
            localStorage.setItem(`ledgers_${activeCompanyId}`, JSON.stringify(allLedgers));
        }
        
        const purchasesJson = localStorage.getItem(`purchases_${activeCompanyId}`);
        const allPurchases: Purchase[] = purchasesJson ? JSON.parse(purchasesJson) : [];
        const newPurchaseId = `pur-${Date.now()}`;

        const newPurchase: Purchase = {
            id: newPurchaseId,
            supplierId,
            supplierName,
            billNumber,
            date: new Date(billDate).toISOString(),
            items: validItems.map(item => ({...item, quantity: Number(item.quantity), price: Number(item.price), hsn: item.hsn})),
            totalAmount,
            payments: [],
            paidAmount: 0,
            balanceDue: totalAmount,
            paymentStatus: totalAmount > 0 ? "Unpaid" : "Paid",
        };
        allPurchases.push(newPurchase);
        localStorage.setItem(`purchases_${activeCompanyId}`, JSON.stringify(allPurchases));

        const materialsJson = localStorage.getItem(`raw_materials_${activeCompanyId}`);
        let currentMaterials: RawMaterial[] = materialsJson ? JSON.parse(materialsJson) : [];
        for (const item of newPurchase.items) {
            currentMaterials = currentMaterials.map(m => {
                if (m.id === item.id) {
                    return { ...m, quantity: m.quantity + item.quantity };
                }
                return m;
            });
        }
        localStorage.setItem(`raw_materials_${activeCompanyId}`, JSON.stringify(currentMaterials));
        setAllRawMaterials(currentMaterials);

        const ledgerEntriesJson = localStorage.getItem(`ledger_entries_${activeCompanyId}`);
        let ledgerEntries: LedgerEntry[] = ledgerEntriesJson ? JSON.parse(ledgerEntriesJson) : [];
        const purchaseDebitEntry: LedgerEntry = { id: `le-${Date.now()}-1`, date: newPurchase.date, accountId: 'PURCHASE_ACCOUNT', accountName: 'Purchase Account', type: 'Purchase', details: `Bill #${billNumber} from ${supplierName}`, debit: totalAmount, credit: 0, refId: newPurchase.id };
        const supplierCreditEntry: LedgerEntry = { id: `le-${Date.now()}-2`, date: newPurchase.date, accountId: supplierId, accountName: supplierName, type: 'Purchase', details: `Against Bill #${billNumber}`, debit: 0, credit: totalAmount, refId: newPurchase.id };
        ledgerEntries.push(purchaseDebitEntry, supplierCreditEntry);
        localStorage.setItem(`ledger_entries_${activeCompanyId}`, JSON.stringify(ledgerEntries));

        toast({ title: "Purchase Recorded", description: `Purchase from ${supplierName} has been saved.` });
        
        // Reset form
        setSupplierName("");
        setSupplierGstin("");
        setSelectedSupplierId(null);
        setBillNumber("");
        setBillDate(new Date().toISOString().split("T")[0]);
        setPurchaseItems([{id: '', name: '', hsn: '', quantity: '', price: ''}]);
    } catch(error: any) {
        toast({ variant: "destructive", title: "Failed to record purchase", description: error.message });
    }
  };

  if (isCompanyLoading) {
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
        Create a new purchase entry. This updates raw material inventory and supplier ledgers.
      </p>
      <Separator />
      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Purchase Entry</CardTitle>
                <CardDescription>Enter supplier, bill, and item details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
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
                                {isSuggestionsOpen && supplierSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                                        <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                            {supplierSuggestions.map(supplier => (
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
                                                    placeholder="Type to search material"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                    onFocus={() => setActiveMaterialInput(index)}
                                                    onBlur={() => setTimeout(() => { setActiveMaterialInput(null); setMaterialSuggestions([]); }, 150)}
                                                    autoComplete="off"
                                                    required
                                                />
                                                {activeMaterialInput === index && materialSuggestions.length > 0 && (
                                                    <div className="absolute z-20 w-full mt-1 bg-card border rounded-md shadow-lg">
                                                        <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                                            {materialSuggestions.map(material => (
                                                                <div key={material.id} className="p-2 hover:bg-muted rounded-md cursor-pointer" onMouseDown={() => handleSelectMaterial(index, material)}>
                                                                    {material.name} ({material.locationName || 'No Location'})
                                                                </div>
                                                            ))}
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
                <Button type="submit" disabled={purchaseItems.filter(i => i.id).length === 0 || totalAmount <= 0}>Record Purchase</Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
