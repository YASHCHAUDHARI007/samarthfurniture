
"use client";

import React, { useState } from "react";
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

const ORDERS_STORAGE_KEY = "samarth_furniture_orders";
type OrderStatus = "Pending" | "Working" | "Completed" | "Delivered";

type Order = {
  id: string;
  customer: string;
  item: string;
  status: OrderStatus;
  type: "Customized" | "Dealer";
  details: string;
  createdBy?: string;
  dimensions?: {
    height?: string;
    width?: string;
    depth?: string;
  };
  dimensionDetails?: string;
  photoDataUrl?: string;
  customerInfo: {
    name: string;
    email?: string;
    address?: string;
    dealerId?: string;
  };
  transportDetails?: {
    driverName: string;
    driverContact: string;
    vehicleNumber: string;
    vehicleModel: string;
  };
};

const productCatalog = [
  {
    id: "prod_001",
    name: "Modular 'L' Sofa",
    sku: "SOF-MOD-L-GRY",
    image: "https://placehold.co/100x100.png",
    aiHint: "sofa couch",
  },
  {
    id: "prod_002",
    name: "Minimalist Oak Desk",
    sku: "DSK-OAK-MIN-150",
    image: "https://placehold.co/100x100.png",
    aiHint: "desk office",
  },
  {
    id: "prod_003",
    name: "Floating Wall Shelf",
    sku: "SHL-WAL-FLT-WHT",
    image: "https://placehold.co/100x100.png",
    aiHint: "shelf wall",
  },
  {
    id: "prod_004",
    name: "Upholstered Dining Chair",
    sku: "CHR-DIN-UPH-BGE",
    image: "https://placehold.co/100x100.png",
    aiHint: "chair dining",
  },
];

type OrderItem = {
  id: string;
  quantity: number;
};

export default function DealerOrderPage() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();

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
    const formData = new FormData(e.target as HTMLFormElement);
    const dealerName = formData.get("dealerName") as string;
    const dealerId = formData.get("dealerId") as string;

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

    const summary = `${orderItems.reduce((acc, item) => acc + item.quantity, 0)} total units`;
    
    const loggedInUser = localStorage.getItem("loggedInUser");

    const newOrder: Order = {
      id: `ORD-D${Date.now().toString().slice(-4)}`,
      customer: dealerName,
      item: `Bulk Order: ${summary}`,
      status: "Pending",
      type: "Dealer",
      details: orderDescription,
      createdBy: loggedInUser || undefined,
      customerInfo: {
        name: dealerName,
        dealerId: dealerId,
      },
    };

    const savedOrdersRaw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const savedOrders: Order[] = savedOrdersRaw
      ? JSON.parse(savedOrdersRaw)
      : [];
    const updatedOrders = [...savedOrders, newOrder];

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));

    toast({
      title: "Dealer Order Placed!",
      description: "The bulk order has been sent to the factory.",
    });
    setOrderItems([]);
    (e.target as HTMLFormElement).reset();
  };

  const isProductSelected = (productId: string) => {
    return orderItems.some((item) => item.id === productId);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">New Dealer Order</h2>
      <p className="text-muted-foreground">
        Create a new bulk order for a registered dealer.
      </p>
      <Separator />
      <form onSubmit={handleSubmit}>
        <Card>
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
                <Input
                  id="dealerName"
                  name="dealerName"
                  placeholder="e.g. Modern Furnishings Co."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealerId">Dealer ID</Label>
                <Input
                  id="dealerId"
                  name="dealerId"
                  placeholder="e.g. DEALER-12345"
                  required
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCatalog.map((product) => (
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
                    </TableRow>
                  ))}
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
  );
}
