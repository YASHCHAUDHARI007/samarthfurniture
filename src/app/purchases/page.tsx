
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

type PurchaseItem = {
  id: string; // Raw material ID
  name: string;
  quantity: number | "";
  price: number | "";
};

export default function PurchasesPage() {
  const { toast } = useToast();
  const [allSuppliers, setAllSuppliers] = useState<Contact[]>([]);
  const [allRawMaterials, setAllRawMaterials] = useState<RawMaterial[]>([]);

  const [suggestions, setSuggestions] = useState<Contact[]>([]);

  const [supplierName, setSupplierName] = useState("");
  const [supplierGstin, setSupplierGstin] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  
  const [activeMaterialInput, setActiveMaterialInput] = useState<number | null>(null);

  useEffect(() => {
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    setAllSuppliers(storedContacts.filter(c => c.type === 'Supplier'));
    
    const storedMaterials: RawMaterial[] = JSON.parse(localStorage.getItem('samarth_furniture_raw_materials') || '[]');
    setAllRawMaterials(storedMaterials);
  }, []);

  const handleSupplierNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSupplierName(value);

    if (value) {
      const filtered = allSuppliers.filter(s => s.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSupplier = (supplier: Contact) => {
    setSupplierName(supplier.name);
    setSupplierGstin(supplier.gstin || "");
    setSelectedSupplierId(supplier.id);
    setSuggestions([]);
  };
  
  const addPurchaseItem = () => {
    setPurchaseItems(current => [...current, {id: '', name: '', quantity: '', price: ''}]);
  };
  
  const removePurchaseItem = (index: number) => {
    setPurchaseItems(current => current.filter((_, i) => i !== index));
  };
  
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    setPurchaseItems(current => current.map((item, i) => {
        if (i === index) {
            const updatedItem = { ...item, [field]: value };
            
            if (field === 'name') {
              // When user types, we should clear the ID to ensure they select an item
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

    if (!supplierName || !billNumber || !billDate || purchaseItems.length === 0 || totalAmount <= 0) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill all supplier, bill and item details."});
        return;
    }

    // --- Save or update supplier ---
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    let supplier: Contact | undefined = storedContacts.find(
      (c) => c.type === 'Supplier' && c.name.toLowerCase() === supplierName.toLowerCase()
    );
    let supplierId: string;

    if (supplier) {
        supplierId = supplier.id;
        if(supplier.gstin !== supplierGstin) {
            const updatedContacts = storedContacts.map(c => c.id === supplierId ? {...c, gstin: supplierGstin} : c);
            localStorage.setItem('samarth_furniture_contacts', JSON.stringify(updatedContacts));
            setAllSuppliers(updatedContacts.filter(c => c.type === 'Supplier'));
        }
    } else {
        supplierId = `SUPP-${Date.now()}`;
        supplier = {
            id: supplierId,
            name: supplierName,
            type: 'Supplier',
            gstin: supplierGstin,
        };
        const updatedContacts = [...storedContacts, supplier];
        localStorage.setItem('samarth_furniture_contacts', JSON.stringify(updatedContacts));
        setAllSuppliers(updatedContacts.filter(c => c.type === 'Supplier'));
    }

    // --- Create Purchase Record ---
    const newPurchase: Purchase = {
        id: `PUR-${Date.now()}`,
        supplierId,
        supplierName,
        billNumber,
        date: new Date(billDate).toISOString(),
        items: purchaseItems.map(item => ({...item, quantity: Number(item.quantity), price: Number(item.price)})).filter(item => item.id),
        totalAmount,
    };

    const allPurchases: Purchase[] = JSON.parse(localStorage.getItem('samarth_furniture_purchases') || '[]');
    localStorage.setItem('samarth_furniture_purchases', JSON.stringify([...allPurchases, newPurchase]));

    // --- Update Raw Material Stock ---
    let materials: RawMaterial[] = JSON.parse(localStorage.getItem('samarth_furniture_raw_materials') || '[]');
    newPurchase.items.forEach(item => {
        const materialIndex = materials.findIndex(m => m.id === item.id);
        if (materialIndex !== -1) {
            materials[materialIndex].quantity += item.quantity;
        }
    });
    localStorage.setItem('samarth_furniture_raw_materials', JSON.stringify(materials));
    setAllRawMaterials(materials);

    // --- Create Ledger Entries ---
    const ledgerEntries: LedgerEntry[] = JSON.parse(localStorage.getItem('samarth_furniture_ledger') || '[]');
    const purchaseDebitEntry: LedgerEntry = {
        id: `LEDG-${Date.now()}-D`,
        date: newPurchase.date,
        accountId: 'PURCHASE_ACCOUNT',
        accountName: 'Purchase Account',
        type: 'Purchase',
        details: `Bill #${billNumber} from ${supplierName}`,
        debit: totalAmount,
        credit: 0,
        refId: newPurchase.id,
    };
    const supplierCreditEntry: LedgerEntry = {
        id: `LEDG-${Date.now()}-C`,
        date: newPurchase.date,
        accountId: supplierId,
        accountName: supplierName,
        type: 'Purchase',
        details: `Bill #${billNumber}`,
        debit: 0,
        credit: totalAmount,
        refId: newPurchase.id,
    };
    ledgerEntries.push(purchaseDebitEntry, supplierCreditEntry);
    localStorage.setItem('samarth_furniture_ledger', JSON.stringify(ledgerEntries));

    toast({ title: "Purchase Recorded", description: `Purchase from ${supplierName} has been saved.` });
    
    // --- Reset form ---
    setSupplierName("");
    setSupplierGstin("");
    setSelectedSupplierId(null);
    setBillNumber("");
    setBillDate(new Date().toISOString().split("T")[0]);
    setPurchaseItems([]);
  };

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
            <CardTitle>Purchase Details</CardTitle>
            <CardDescription>
              Enter supplier and bill information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="supplierName">Supplier Name</Label>
                    <div className="relative">
                        <Input
                            id="supplierName"
                            placeholder="e.g. Royal Hardware"
                            required
                            value={supplierName}
                            onChange={handleSupplierNameChange}
                            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                            autoComplete="off"
                        />
                        {suggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                                <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                                    {suggestions.map(supplier => (
                                        <div
                                            key={supplier.id}
                                            className="p-2 hover:bg-muted rounded-md cursor-pointer"
                                            onMouseDown={() => handleSelectSupplier(supplier)}
                                        >
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
                    <Input
                    id="supplierGstin"
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    value={supplierGstin}
                    onChange={(e) => setSupplierGstin(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="billNumber">Bill Number</Label>
                    <Input id="billNumber" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} required />
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Purchased Items</CardTitle>
                <CardDescription>Add the raw materials purchased in this bill.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Material</TableHead>
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
                                                                <div
                                                                    key={material.id}
                                                                    className="p-2 hover:bg-muted rounded-md cursor-pointer"
                                                                    onMouseDown={() => {
                                                                        handleItemChange(index, 'id', material.id);
                                                                        setActiveMaterialInput(null);
                                                                    }}
                                                                >
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
                                        <Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || "")} min="0" placeholder="0"/>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || "")} min="0" placeholder="0.00"/>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removePurchaseItem(index)} className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {purchaseItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No items added.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <Button variant="outline" size="sm" onClick={addPurchaseItem} className="mt-4">Add Item</Button>
            </CardContent>
            <CardFooter className="flex-col items-end space-y-2">
                 <div className="flex w-full max-w-xs justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <div className="flex items-center">
                        <IndianRupee className="h-5 w-5 mr-1" />
                        <span>{totalAmount.toFixed(2)}</span>
                    </div>
                </div>
                <Button type="submit" disabled={totalAmount <= 0}>Record Purchase</Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
