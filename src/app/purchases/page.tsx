
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [supplierName, setSupplierName] = useState("");
  const [supplierGstin, setSupplierGstin] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  useEffect(() => {
    const storedContacts: Contact[] = JSON.parse(localStorage.getItem('samarth_furniture_contacts') || '[]');
    setAllSuppliers(storedContacts.filter(c => c.type === 'Supplier'));
    
    const storedMaterials: RawMaterial[] = JSON.parse(localStorage.getItem('samarth_furniture_raw_materials') || '[]');
    setAllRawMaterials(storedMaterials);
  }, []);

  const handleSupplierNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSupplierName(value);
    setSelectedSupplierId(null); // Clear selected ID when name is manually changed

    if (value.length > 1) {
      const filtered = allSuppliers.filter(s => s.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
      setIsPopoverOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsPopoverOpen(false);
    }
  };

  const handleSelectSupplier = (supplier: Contact) => {
    setSupplierName(supplier.name);
    setSupplierGstin(supplier.gstin || "");
    setSelectedSupplierId(supplier.id);
    setSuggestions([]);
    setIsPopoverOpen(false);
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
    let supplierId: string;
    
    // First, try to find an existing supplier by the name entered in the input box.
    const existingSupplier = storedContacts.find(
      s => s.type === 'Supplier' && s.name.toLowerCase() === supplierName.toLowerCase()
    );

    if (existingSupplier) {
      // If found, use their ID and check if the GSTIN needs updating.
      supplierId = existingSupplier.id;
      if (existingSupplier.gstin !== supplierGstin) {
        const updatedContacts = storedContacts.map(c => 
          c.id === supplierId ? { ...c, gstin: supplierGstin } : c
        );
        localStorage.setItem('samarth_furniture_contacts', JSON.stringify(updatedContacts));
        setAllSuppliers(updatedContacts.filter(c => c.type === 'Supplier'));
      }
    } else {
      // If no supplier with that name exists, create a new one.
      supplierId = `SUPP-${Date.now()}`;
      const newSupplier: Contact = {
        id: supplierId,
        name: supplierName,
        type: 'Supplier',
        gstin: supplierGstin,
      };
      const updatedContacts = [...storedContacts, newSupplier];
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
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Input
                        id="supplierName"
                        placeholder="e.g. Royal Hardware"
                        required
                        value={supplierName}
                        onChange={handleSupplierNameChange}
                        autoComplete="off"
                        />
                    </PopoverTrigger>
                    {suggestions.length > 0 && (
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <div className="flex flex-col gap-1 p-1">
                            {suggestions.map(supplier => (
                                <Button
                                    key={supplier.id}
                                    variant="ghost"
                                    className="justify-start"
                                    onClick={() => handleSelectSupplier(supplier)}
                                >
                                    {supplier.name}
                                </Button>
                            ))}
                        </div>
                        </PopoverContent>
                    )}
                    </Popover>
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
                                        <Select value={item.id} onValueChange={(value) => handleItemChange(index, 'id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a material" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allRawMaterials.map(mat => (
                                                    <SelectItem key={mat.id} value={mat.id}>{mat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
