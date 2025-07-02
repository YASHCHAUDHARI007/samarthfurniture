
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
import { Badge } from "@/components/ui/badge";
import type { Order, StockItem, Ledger } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type OrderItem = {
  id: string; // StockItem ID
  quantity: number;
};

type CustomItem = {
  id: string;
  name: string;
  quantity: number;
}

export default function DealerOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const [allDealers, setAllDealers] = useState<Ledger[]>([]);
  const [suggestions, setSuggestions] = useState<Ledger[]>([]);
  
  const [dealerName, setDealerName] = useState("");
  const [dealerId, setDealerId] = useState("");
  
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQuantity, setCustomItemQuantity] = useState<number | "">(1);

  useEffect(() => {
    const companyId = localStorage.getItem('activeCompanyId');
    setActiveCompanyId(companyId);
  }, []);

  useEffect(() => {
    if (!activeCompanyId) {
      setStockItems([]);
      setAllDealers([]);
      return;
    };
    
    const stockJson = localStorage.getItem(`stock_items_${activeCompanyId}`);
    setStockItems(stockJson ? JSON.parse(stockJson) : []);

    const ledgersJson = localStorage.getItem(`ledgers_${activeCompanyId}`);
    const ledgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
    setAllDealers(ledgers.filter(c => c.group === 'Sundry Debtors'));

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
    stockItemId: string,
    checked: boolean | "indeterminate"
  ) => {
    if (checked) {
      setOrderItems([...orderItems, { id: stockItemId, quantity: 1 }]);
    } else {
      setOrderItems(orderItems.filter((item) => item.id !== stockItemId));
    }
  };

  const handleQuantityChange = (stockItemId: string, quantity: number) => {
    const itemExists = orderItems.some((item) => item.id === stockItemId);
    if (!itemExists) return;

    const stockItem = stockItems.find(item => item.id === stockItemId);

    if (stockItem && quantity > stockItem.quantity) {
        toast({
            variant: "destructive",
            title: "Stock limit exceeded",
            description: `Only ${stockItem.quantity} units of ${stockItem.name} are available.`
        });
        setOrderItems(orderItems.map(item => item.id === stockItemId ? { ...item, quantity: stockItem.quantity } : item));
    } else {
        setOrderItems(
          orderItems.map((item) =>
            item.id === stockItemId
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          )
        );
    }
  };
  
  const getQuantityForItem = (itemId: string) => {
      const orderItem = orderItems.find(oi => oi.id === itemId);
      return orderItem ? orderItem.quantity : '';
  }

  const handleAddCustomItem = () => {
    if (!customItemName || !customItemQuantity || customItemQuantity <= 0) {
        toast({
            variant: "destructive",
            title: "Invalid Custom Item",
            description: "Please provide a name and a valid quantity."
        });
        return;
    }
    setCustomItems(current => [...current, { id: `custom-${Date.now()}`, name: customItemName, quantity: Number(customItemQuantity) }]);
    setCustomItemName("");
    setCustomItemQuantity(1);
  };

  const handleRemoveCustomItem = (id: string) => {
      setCustomItems(current => current.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeCompanyId) {
        toast({ variant: "destructive", title: "No Active Company", description: "Please select a company before creating an order." });
        return;
    }
    
    if (!dealerName) {
        toast({ variant: "destructive", title: "Missing Dealer Name", description: "Please select an existing dealer or enter a name for a new one."});
        return;
    }

    const finalOrderItems = orderItems.filter(item => item.quantity > 0);

    if (finalOrderItems.length === 0 && customItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No Items in Order",
        description: "Please select products from the catalog or add custom items.",
      });
      return;
    }

    const stockItemsDescription = finalOrderItems
      .map((item) => {
        const product = stockItems.find((p) => p.id === item.id);
        return `${item.quantity}x ${product?.name} (SKU: ${product?.sku})`;
      })
      .join("\n");

    const customItemsDescription = customItems
      .map(item => `${item.quantity}x ${item.name} (Custom)`)
      .join("\n");
      
    const orderDescription = [stockItemsDescription, customItemsDescription].filter(Boolean).join("\n");

    if (!orderDescription) {
      toast({
        variant: "destructive",
        title: "No Quantities Specified",
        description: "Please specify a quantity for the selected or custom items.",
      });
      return;
    }

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
        };
        ledgers.push(newDealerData);
    } else {
        contactId = dealer.id;
        if (dealerId && dealer.dealerId !== dealerId) {
            dealer.dealerId = dealerId;
            ledgers = ledgers.map(l => l.id === contactId ? dealer! : l);
        }
        finalDealerId = dealer.dealerId || dealerId || `DEALER-${Date.now()}`;
    }
    localStorage.setItem(`ledgers_${activeCompanyId}`, JSON.stringify(ledgers));
    
    // Manage orders
    const ordersJson = localStorage.getItem(`orders_${activeCompanyId}`);
    const allOrders: Order[] = ordersJson ? JSON.parse(ordersJson) : [];

    const totalStockUnits = finalOrderItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalCustomUnits = customItems.reduce((acc, item) => acc + item.quantity, 0);
    const summary = `${totalStockUnits + totalCustomUnits} total units`;
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
      },
    };

    allOrders.push(newOrder);
    localStorage.setItem(`orders_${activeCompanyId}`, JSON.stringify(allOrders));

    toast({
      title: "Dealer Order Placed!",
      description: "The bulk order has been sent to the factory.",
    });

    setOrderItems([]);
    setCustomItems([]);
    setDealerName("");
    setDealerId("");
    (e.target as HTMLFormElement).reset();
  };


  const isItemSelected = (stockItemId: string) => {
    return orderItems.some((item) => item.id === stockItemId);
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
        Create a new bulk order for a registered dealer from available finished stock.
      </p>
      <Separator />

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
                  placeholder="Auto-generated if new"
                  value={dealerId}
                  onChange={(e) => setDealerId(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <CardTitle className="pt-4">Product Catalog</CardTitle>
            <CardDescription>
              Select products and specify quantities for the order. To manage stock levels, go to the Finished Stock page.
            </CardDescription>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="w-[120px]">Available</TableHead>
                    <TableHead className="w-[120px]">Order Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.length > 0 ? stockItems.map((item) => (
                    <TableRow key={item.id} data-state={isItemSelected(item.id) ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          id={`select-${item.id}`}
                          onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)}
                          checked={isItemSelected(item.id)}
                          disabled={item.quantity <= 0}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Image
                            src="https://placehold.co/40x40.png"
                            alt={item.name}
                            width={40}
                            height={40}
                            className="rounded-md"
                            data-ai-hint={`product ${item.name.split(" ")[0]?.toLowerCase()}`}
                          />
                          <div>
                            <span>{item.name}</span>
                             {item.quantity <= 0 && <Badge variant="destructive" className="ml-2 text-xs">Out of Stock</Badge>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity > 0 ? item.quantity : undefined}
                          value={getQuantityForItem(item.id)}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="w-24"
                          disabled={!isItemSelected(item.id) || item.quantity <= 0}
                          placeholder="0"
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">No finished goods in stock. Add items on the Finished Stock page.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <Separator className="my-6" />

            <CardTitle className="pt-4">Add Custom/Out-of-Stock Items</CardTitle>
            <CardDescription>
              Add products that are not in the current stock catalog. These will be treated as made-to-order.
            </CardDescription>

            <div className="flex items-end gap-2 py-4">
                <div className="grid flex-grow gap-1.5">
                    <Label htmlFor="customItemName">Product Name</Label>
                    <Input id="customItemName" placeholder="e.g. Special Edition Chair" value={customItemName} onChange={(e) => setCustomItemName(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="customItemQty">Quantity</Label>
                    <Input id="customItemQty" type="number" className="w-24" placeholder="1" value={customItemQuantity} onChange={(e) => setCustomItemQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
                </div>
                <Button type="button" variant="outline" onClick={handleAddCustomItem}>Add Item</Button>
            </div>

            {customItems.length > 0 && (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Custom Item</TableHead>
                                <TableHead className="w-[120px]">Quantity</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCustomItem(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
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

