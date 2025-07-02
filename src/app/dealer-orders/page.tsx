
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
import type { Order, CatalogItem, Ledger } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { useCompany } from "@/contexts/company-context";

type OrderItem = {
  id: string; // CatalogItem ID
  quantity: number;
};

export default function DealerOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeCompany, isLoading: isCompanyLoading } = useCompany();
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  const [allDealers, setAllDealers] = useState<Ledger[]>([]);
  const [suggestions, setSuggestions] = useState<Ledger[]>([]);
  
  // Dealer Information State
  const [dealerName, setDealerName] = useState("");
  const [dealerId, setDealerId] = useState("");
  const [dealerEmail, setDealerEmail] = useState("");
  const [dealerAddress, setDealerAddress] = useState("");
  const [dealerGstin, setDealerGstin] = useState("");
  
  useEffect(() => {
    if (!activeCompany) {
      setCatalogItems([]);
      setAllDealers([]);
      return;
    };
    
    const catalogJson = localStorage.getItem(`catalog_items_${activeCompany.id}`);
    setCatalogItems(catalogJson ? JSON.parse(catalogJson) : []);

    const ledgersJson = localStorage.getItem(`ledgers_${activeCompany.id}`);
    const ledgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
    setAllDealers(ledgers.filter(c => c.group === 'Sundry Debtors'));

  }, [activeCompany]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDealerName(value);

    if (value.length > 1) {
      const filtered = allDealers.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
    
    // Clear other fields if name is being changed manually
    setDealerId("");
    setDealerEmail("");
    setDealerAddress("");
    setDealerGstin("");
  };

  const handleSelectDealer = (dealer: Ledger) => {
    setDealerName(dealer.name);
    setDealerId(dealer.dealerId || "");
    setDealerEmail(dealer.email || "");
    setDealerAddress(dealer.address || "");
    setDealerGstin(dealer.gstin || "");
    setSuggestions([]);
  };

  const handleCheckboxChange = (
    catalogItemId: string,
    checked: boolean | "indeterminate"
  ) => {
    if (checked) {
      setOrderItems([...orderItems, { id: catalogItemId, quantity: 1 }]);
    } else {
      setOrderItems(orderItems.filter((item) => item.id !== catalogItemId));
    }
  };

  const handleQuantityChange = (catalogItemId: string, quantity: number) => {
    const itemExists = orderItems.some((item) => item.id === catalogItemId);
    if (!itemExists) return;

    setOrderItems(
      orderItems.map((item) =>
        item.id === catalogItemId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
    );
  };
  
  const getQuantityForItem = (itemId: string) => {
      const orderItem = orderItems.find(oi => oi.id === itemId);
      return orderItem ? orderItem.quantity : '';
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeCompany) {
        toast({ variant: "destructive", title: "No Active Company", description: "Please select a company before creating an order." });
        return;
    }
    const activeCompanyId = activeCompany.id;
    
    if (!dealerName) {
        toast({ variant: "destructive", title: "Missing Dealer Name", description: "Please select an existing dealer or enter a name for a new one."});
        return;
    }

    const finalOrderItems = orderItems.filter(item => item.quantity > 0);

    if (finalOrderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No Items in Order",
        description: "Please select products from the catalog and specify a quantity.",
      });
      return;
    }

    const orderDescription = finalOrderItems
      .map((item) => {
        const product = catalogItems.find((p) => p.id === item.id);
        return `${item.quantity}x ${product?.name} (SKU: ${product?.sku})`;
      })
      .join("\n");

    // Manage ledgers
    const ledgersJson = localStorage.getItem(`ledgers_${activeCompanyId}`);
    let ledgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
    let dealer = ledgers.find(c => c.name.toLowerCase() === dealerName.toLowerCase());
    let contactId = dealer?.id;
    let finalDealerId = dealerId;
    
    if (!dealer) {
        contactId = `LEDG-${Date.now()}`;
        finalDealerId = dealerId || `DEALER-${Date.now()}`;
        const newDealerData: Ledger = {
            id: contactId,
            name: dealerName,
            group: 'Sundry Debtors',
            dealerId: finalDealerId,
            email: dealerEmail,
            address: dealerAddress,
            gstin: dealerGstin,
        };
        ledgers.push(newDealerData);
    } else {
        contactId = dealer.id;
        // Update existing dealer info
        dealer.dealerId = dealerId || dealer.dealerId || `DEALER-${Date.now()}`;
        dealer.email = dealerEmail;
        dealer.address = dealerAddress;
        dealer.gstin = dealerGstin;
        ledgers = ledgers.map(l => l.id === contactId ? dealer! : l);
        finalDealerId = dealer.dealerId;
    }
    localStorage.setItem(`ledgers_${activeCompanyId}`, JSON.stringify(ledgers));
    
    // Manage orders
    const ordersJson = localStorage.getItem(`orders_${activeCompanyId}`);
    const allOrders: Order[] = ordersJson ? JSON.parse(ordersJson) : [];

    const totalUnits = finalOrderItems.reduce((acc, item) => acc + item.quantity, 0);
    const summary = `${totalUnits} total units`;
    const loggedInUser = localStorage.getItem("loggedInUser");

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      customer: dealerName,
      item: `Bulk Order: ${summary}`,
      status: "Pending",
      type: "Dealer",
      details: orderDescription,
      createdBy: loggedInUser || undefined,
      createdAt: new Date().toISOString(),
      customerInfo: {
        id: contactId!,
        name: dealerName,
        dealerId: finalDealerId,
        email: dealerEmail,
        address: dealerAddress,
        gstin: dealerGstin,
      },
    };

    allOrders.push(newOrder);
    localStorage.setItem(`orders_${activeCompanyId}`, JSON.stringify(allOrders));

    toast({
      title: "Dealer Order Placed!",
      description: "The bulk order has been sent to the factory.",
    });

    setOrderItems([]);
    setDealerName("");
    setDealerId("");
    setDealerEmail("");
    setDealerAddress("");
    setDealerGstin("");
    (e.target as HTMLFormElement).reset();
  };


  const isItemSelected = (catalogItemId: string) => {
    return orderItems.some((item) => item.id === catalogItemId);
  };
  
  if (isCompanyLoading) {
    return <div className="flex-1 p-8 pt-6">Loading...</div>;
  }
  
  if (!activeCompany) {
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
        Create a new bulk order for a registered dealer from the product catalog.
      </p>
      <Separator />

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dealer Information</CardTitle>
            <CardDescription>
              Select an existing dealer or enter details for a new one.
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
                  placeholder="Auto-generated if new"
                  value={dealerId}
                  onChange={(e) => setDealerId(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="dealerEmail">Dealer Email</Label>
                    <Input id="dealerEmail" name="dealerEmail" type="email" placeholder="dealer@example.com" value={dealerEmail} onChange={e => setDealerEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dealerGstin">Dealer GSTIN</Label>
                    <Input id="dealerGstin" name="dealerGstin" placeholder="29ABCDE1234F1Z5" value={dealerGstin} onChange={e => setDealerGstin(e.target.value.toUpperCase())} className="uppercase" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="dealerAddress">Dealer Address</Label>
                <Textarea id="dealerAddress" name="dealerAddress" placeholder="123 Main St, Anytown" value={dealerAddress} onChange={e => setDealerAddress(e.target.value)} rows={2} />
            </div>


            <Separator />

            <CardTitle className="pt-4">Product Catalog</CardTitle>
            <CardDescription>
              Select products and specify quantities for the order. To manage the catalog, go to the Product Catalog page.
            </CardDescription>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="w-[120px]">Order Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogItems.length > 0 ? catalogItems.map((item) => (
                    <TableRow key={item.id} data-state={isItemSelected(item.id) ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          id={`select-${item.id}`}
                          onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)}
                          checked={isItemSelected(item.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Image
                            src={item.photoDataUrl || "https://placehold.co/40x40.png"}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                            data-ai-hint={`product ${item.name.split(" ")[0]?.toLowerCase()}`}
                          />
                          <span>{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={getQuantityForItem(item.id)}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="w-24"
                          disabled={!isItemSelected(item.id)}
                          placeholder="0"
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No products in catalog. Add items on the Product Catalog page.</TableCell>
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
    </>
  );
}
