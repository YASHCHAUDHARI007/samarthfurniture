
"use client";

import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
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
import { Trash2 } from "lucide-react";
import type { Order, Product, Ledger } from "@/lib/types";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  quantity: number;
};

export default function DealerOrderPage() {
  const router = useRouter();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();
  
  const [productCatalog, setProductCatalog] = useState<Product[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemSku, setNewItemSku] = useState("");

  const [allDealers, setAllDealers] = useState<Ledger[]>([]);
  const [suggestions, setSuggestions] = useState<Ledger[]>([]);
  
  const [dealerName, setDealerName] = useState("");
  const [dealerId, setDealerId] = useState("");
  
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const getCompanyStorageKey = (baseKey: string) => {
    if (!activeCompanyId) return null;
    return `samarth_furniture_${activeCompanyId}_${baseKey}`;
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "factory" || role === "administrator" || role === "owner") {
      setCanEdit(true);
    }
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
  }, []);

  useEffect(() => {
    if (!activeCompanyId) {
      setProductCatalog([]);
      setAllDealers([]);
      return;
    };
    
    const catalogKey = getCompanyStorageKey('product_catalog')!;
    const ledgersKey = getCompanyStorageKey('ledgers')!;

    const storedCatalog = localStorage.getItem(catalogKey);
    setProductCatalog(storedCatalog ? JSON.parse(storedCatalog) : []);
    
    const storedLedgers: Ledger[] = JSON.parse(localStorage.getItem(ledgersKey) || '[]');
    setAllDealers(storedLedgers.filter((c): c is Ledger => c !== undefined).filter(c => c.group === 'Sundry Debtors'));

  }, [activeCompanyId]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDealerName(value);

    if (value.length > 1) {
      const filtered = allDealers.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectDealer = (dealer: Ledger) => {
    setDealerName(dealer.name);
    setDealerId(dealer.dealerId || "");
    setSuggestions([]);
  };


  const handleCheckboxChange = (
    productId: string,
    checked: boolean | "indeterminate"
  ) => {
    if (checked) {
      setOrderItems([...orderItems, { id: productId, quantity: 1 }]);
    } else {
      setOrderItems(orderItems.filter((item) => item.id !== productId));
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const itemExists = orderItems.some((item) => item.id === productId);
    if (!itemExists) return;

    setOrderItems(
      orderItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeCompanyId) {
        toast({ variant: "destructive", title: "No Active Company", description: "Please select a company before creating an order." });
        return;
    }
    
    if (!dealerName || !dealerId) {
        toast({ variant: "destructive", title: "Missing Dealer Info", description: "Please fill in all dealer details."});
        return;
    }

    if (orderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No Items Selected",
        description: "Please select at least one product for the order.",
      });
      return;
    }

    const orderDescription = orderItems
      .filter((item) => item.quantity > 0)
      .map((item) => {
        const product = productCatalog.find((p) => p.id === item.id);
        return `${item.quantity}x ${product?.name} (SKU: ${product?.sku})`;
      })
      .join("\n");

    if (!orderDescription) {
      toast({
        variant: "destructive",
        title: "No Quantities Specified",
        description: "Please specify a quantity for the selected items.",
      });
      return;
    }

    const ledgersKey = getCompanyStorageKey('ledgers')!;
    const ordersKey = getCompanyStorageKey('orders')!;

    const storedLedgers: Ledger[] = JSON.parse(localStorage.getItem(ledgersKey) || '[]');
    let dealer = storedLedgers.find(c => c.name.toLowerCase() === dealerName.toLowerCase() && c.group === 'Sundry Debtors');
    let contactId = '';
    
    if (!dealer) {
        contactId = `LEDG-${Date.now()}`;
        dealer = {
            id: contactId,
            name: dealerName,
            group: 'Sundry Debtors',
            dealerId: dealerId,
        };
        const updatedLedgers = [...storedLedgers, dealer];
        localStorage.setItem(ledgersKey, JSON.stringify(updatedLedgers));
        setAllDealers(updatedLedgers.filter(c => c.group === 'Sundry Debtors'));
    } else {
        contactId = dealer.id;
        if (dealer.dealerId !== dealerId) {
            dealer.dealerId = dealerId;
            const updatedLedgers = storedLedgers.map(c => c.id === dealer!.id ? dealer : c);
            localStorage.setItem(ledgersKey, JSON.stringify(updatedLedgers));
            setAllDealers(updatedLedgers.filter(c => c.group === 'Sundry Debtors'));
        }
    }


    const summary = `${orderItems.reduce((acc, item) => acc + item.quantity, 0)} total units`;
    const loggedInUser = localStorage.getItem("loggedInUser");

    const newOrder: Order = {
      id: `ORD-${new Date().getTime()}`,
      customer: dealerName,
      item: `Bulk Order: ${summary}`,
      status: "Pending",
      type: "Dealer",
      details: orderDescription,
      createdBy: loggedInUser || undefined,
      createdAt: new Date().toISOString(),
      customerInfo: {
        id: contactId,
        name: dealerName,
        dealerId: dealerId,
      },
    };

    const existingOrders: Order[] = JSON.parse(localStorage.getItem(ordersKey) || "[]");
    localStorage.setItem(ordersKey, JSON.stringify([...existingOrders, newOrder]));
    toast({
      title: "Dealer Order Placed!",
      description: "The bulk order has been sent to the factory.",
    });

    setOrderItems([]);
    setDealerName("");
    setDealerId("");
    (e.target as HTMLFormElement).reset();
    // This part is tricky, how to reset the checkboxes?
    // A simple way is to force a re-render or manage checkbox state, but for now we leave it.
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeCompanyId) return;

    if (!newItemName || !newItemSku) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide both a name and SKU." });
      return;
    }
    if (productCatalog.some(p => p.sku.toLowerCase() === newItemSku.toLowerCase())) {
        toast({ variant: "destructive", title: "SKU Exists", description: "A product with this SKU already exists." });
        return;
    }
    const newProduct: Product = {
      id: `prod-${new Date().getTime()}`,
      name: newItemName,
      sku: newItemSku,
      image: "https://placehold.co/100x100.png",
      aiHint: "product " + newItemName.split(" ")[0]?.toLowerCase(),
    };
    const updatedCatalog = [...productCatalog, newProduct];
    setProductCatalog(updatedCatalog);
    
    const catalogKey = getCompanyStorageKey('product_catalog')!;
    localStorage.setItem(catalogKey, JSON.stringify(updatedCatalog));
    toast({ title: "Product Added", description: `${newItemName} has been added to the catalog.` });
    setNewItemName("");
    setNewItemSku("");
  };

  const handleDeleteItem = () => {
    if (!itemToDelete || !activeCompanyId) return;
    const updatedCatalog = productCatalog.filter((p) => p.id !== itemToDelete.id);
    setProductCatalog(updatedCatalog);
    
    const catalogKey = getCompanyStorageKey('product_catalog')!;
    localStorage.setItem(catalogKey, JSON.stringify(updatedCatalog));
    toast({
      title: "Product Deleted",
      description: `${itemToDelete.name} has been removed from the catalog.`,
      variant: "destructive",
    });
    setItemToDelete(null);
  };

  const isProductSelected = (productId: string) => {
    return orderItems.some((item) => item.id === productId);
  };
  
  if (!activeCompanyId) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
            </CardHeader>
            <CardContent><p>Please select or create a company to manage dealer orders.</p></CardContent>
            <CardFooter><Button onClick={() => router.push("/manage-companies")}>Go to Companies</Button></CardFooter>
          </Card>
        </div>
    );
  }

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">New Dealer Order</h2>
      <p className="text-muted-foreground">
        Create a new bulk order for a registered dealer.
      </p>
      <Separator />

      {canEdit && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Manage Product Catalog</CardTitle>
              <CardDescription>
                Add or remove products from the catalog. These changes will be reflected for all users creating dealer orders.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddItem}>
              <CardContent className="space-y-4">
                 <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newItemName">Product Name</Label>
                    <Input
                      id="newItemName"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="e.g. Modern Bookshelf"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newItemSku">SKU</Label>
                    <Input
                      id="newItemSku"
                      value={newItemSku}
                      onChange={(e) => setNewItemSku(e.target.value)}
                      placeholder="e.g. BKS-MOD-WHT"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Add Product to Catalog</Button>
              </CardFooter>
            </form>
          </Card>
        )}

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dealer Information</CardTitle>
            <CardDescription>
              Enter the dealer's information for this bulk order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dealerName">Dealer Name</Label>
                <div className="relative">
                  <Input
                    id="dealerName"
                    name="dealerName"
                    placeholder="e.g. Modern Furnishings Co."
                    required
                    value={dealerName}
                    onChange={handleNameChange}
                    onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                    autoComplete="off"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                      <div className="flex flex-col gap-1 p-1 max-h-60 overflow-y-auto">
                        {suggestions.map(dealer => (
                          <Button
                            key={dealer.id}
                            type="button"
                            variant="ghost"
                            className="justify-start"
                            onClick={() => handleSelectDealer(dealer)}
                          >
                            {dealer.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealerId">Dealer ID</Label>
                <Input
                  id="dealerId"
                  name="dealerId"
                  placeholder="e.g. DEALER-12345"
                  required
                  value={dealerId}
                  onChange={(e) => setDealerId(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <CardTitle className="pt-4">Product Catalog</CardTitle>
            <CardDescription>
              Select products and specify quantities for the order.
            </CardDescription>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCatalog.length > 0 ? productCatalog.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          id={`select-${product.id}`}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(product.id, checked)
                          }
                          checked={isProductSelected(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md"
                            data-ai-hint={product.aiHint}
                          />
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          defaultValue={1}
                          disabled={!isProductSelected(product.id)}
                          onChange={(e) =>
                            handleQuantityChange(
                              product.id,
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                       {canEdit && (
                        <TableCell className="text-right">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={(e) => { e.preventDefault(); setItemToDelete(product); }}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Item</span>
                            </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={canEdit ? 5: 4} className="h-24 text-center">No products in catalog. Add one above.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Place Bulk Order</Button>
          </CardFooter>
        </Card>
      </form>
    </div>

    <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product
                <span className="font-semibold"> {itemToDelete?.name} </span>
                from the catalog.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
