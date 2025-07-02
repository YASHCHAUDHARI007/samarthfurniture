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

type OrderItem = {
  id: string; // StockItem ID
  quantity: number;
};

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
    
    // Use finished product stock as the catalog
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        const product = stockItems.find((p) => p.id === item.id);
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

    // Manage ledgers
    const ledgersJson = localStorage.getItem(`ledgers_${activeCompanyId}`);
    let ledgers: Ledger[] = ledgersJson ? JSON.parse(ledgersJson) : [];
    let dealer = ledgers.find(c => c.name.toLowerCase() === dealerName.toLowerCase());
    let contactId = dealer?.id;
    
    if (!dealer) {
        contactId = `LEDG-${Date.now()}`;
        const newDealerData: Ledger = {
            id: contactId,
            name: dealerName,
            group: 'Sundry Debtors',
            dealerId: dealerId,
        };
        ledgers.push(newDealerData);
    } else {
        dealer.dealerId = dealerId;
        ledgers = ledgers.map(l => l.id === contactId ? dealer! : l);
    }
    localStorage.setItem(`ledgers_${activeCompanyId}`, JSON.stringify(ledgers));
    
    // Manage orders
    const ordersJson = localStorage.getItem(`orders_${activeCompanyId}`);
    const allOrders: Order[] = ordersJson ? JSON.parse(ordersJson) : [];

    const summary = `${orderItems.reduce((acc, item) => acc + item.quantity, 0)} total units`;
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
        dealerId: dealerId,
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
